import { PostgrestError } from "@supabase/supabase-js";
import type { PresetRepository } from "@/lib/preset-repository";
import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { CategorySplitPreset, PresetStatus, PresetMemberConfig, SplitMethod, RoundingMode } from "@/types/domain";

type PresetRow = {
  id: string;
  household_id: string;
  ledger_id: string | null;
  name: string;
  category_ids: string[];
  mode: SplitMethod;
  ratio: number[] | null;
  weights: number[] | null;
  fixed_amounts: number[] | null;
  rounding: RoundingMode;
  conditions: Record<string, unknown> | null;
  priority: number;
  is_default: boolean;
  status: PresetStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_ids: string[];
};

const fail = (error: PostgrestError | null, message: string): never => {
  const detail = error?.message ? ` (${error.message})` : "";
  throw new Error(`${message}${detail}`);
};

const toMemberConfig = (row: PresetRow): PresetMemberConfig[] => {
  return row.member_ids.map((memberId, index) => ({
    memberId,
    ratio: row.ratio?.[index],
    weight: row.weights?.[index],
    fixedAmount: row.fixed_amounts?.[index],
  }));
};

export const toCategorySplitPreset = (row: PresetRow): CategorySplitPreset => ({
  id: row.id,
  name: row.name,
  status: row.status,
  priority: row.priority,
  targetCategoryIds: row.category_ids,
  splitMethod: row.mode,
  roundingMode: row.rounding,
  conditions: (row.conditions ?? {}) as CategorySplitPreset["conditions"],
  members: toMemberConfig(row),
  updatedAt: row.updated_at,
});

export const toPresetInsertPayload = ({
  householdId,
  ledgerId,
  createdBy,
  isDefault,
  preset,
}: {
  householdId: string;
  ledgerId?: string | null;
  createdBy: string;
  isDefault?: boolean;
  preset: CategorySplitPreset;
}) => ({
  id: preset.id,
  household_id: householdId,
  ledger_id: ledgerId ?? null,
  name: preset.name,
  category_ids: preset.targetCategoryIds,
  mode: preset.splitMethod,
  ratio: preset.members.map((member) => member.ratio ?? 0),
  weights: preset.members.map((member) => member.weight ?? 0),
  fixed_amounts: preset.members.map((member) => member.fixedAmount ?? 0),
  rounding: preset.roundingMode,
  conditions: preset.conditions ?? {},
  priority: preset.priority,
  is_default: isDefault ?? false,
  status: preset.status,
  created_by: createdBy,
  member_ids: preset.members.map((member) => member.memberId),
});

const selectColumns = "id,household_id,ledger_id,name,category_ids,mode,ratio,weights,fixed_amounts,rounding,conditions,priority,is_default,status,created_by,created_at,updated_at,member_ids";

export const createSupabasePresetRepository = (): PresetRepository => ({
  async listCategorySplitPresets(params) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    let query = supabase.from("category_split_presets").select(selectColumns).order("priority", { ascending: false }).order("updated_at", { ascending: false });

    if (params?.householdId) query = query.eq("household_id", params.householdId);
    if (params?.ledgerId) query = query.eq("ledger_id", params.ledgerId);
    if (params?.statuses?.length) query = query.in("status", params.statuses);

    const { data, error } = await query;
    if (error) fail(error, "プリセット一覧の取得に失敗しました");

    return (data ?? []).map((row) => toCategorySplitPreset(row as PresetRow));
  },

  async getCategorySplitPresetById(id) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    const { data, error } = await supabase.from("category_split_presets").select(selectColumns).eq("id", id).maybeSingle();
    if (error) fail(error, "プリセット詳細の取得に失敗しました");
    if (!data) return null;
    return toCategorySplitPreset(data as PresetRow);
  },

  async createCategorySplitPreset(input) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    const payload = toPresetInsertPayload(input);
    const { data, error } = await supabase.from("category_split_presets").insert(payload).select(selectColumns).single();
    if (error) fail(error, "プリセットの作成に失敗しました");
    return toCategorySplitPreset(data as PresetRow);
  },

  async updateCategorySplitPreset(input) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    const payload = toPresetInsertPayload({ householdId: "", createdBy: "", preset: input.preset });
    const { data, error } = await supabase
      .from("category_split_presets")
      .update({
        name: payload.name,
        category_ids: payload.category_ids,
        mode: payload.mode,
        ratio: payload.ratio,
        weights: payload.weights,
        fixed_amounts: payload.fixed_amounts,
        rounding: payload.rounding,
        conditions: payload.conditions,
        priority: payload.priority,
        status: payload.status,
        member_ids: payload.member_ids,
      })
      .eq("id", input.id)
      .select(selectColumns)
      .single();
    if (error) fail(error, "プリセットの更新に失敗しました");
    return toCategorySplitPreset(data as PresetRow);
  },

  async duplicateCategorySplitPreset(input) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    const { data: sourceRow, error: sourceError } = await supabase
      .from("category_split_presets")
      .select(selectColumns)
      .eq("id", input.id)
      .maybeSingle();

    if (sourceError) fail(sourceError, "複製対象の取得に失敗しました");
    if (!sourceRow) throw new Error("複製対象のプリセットが見つかりません");

    const source = toCategorySplitPreset(sourceRow as PresetRow);
    const duplicated: CategorySplitPreset = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name}（複製）`,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };

    const payload = toPresetInsertPayload({
      householdId: (sourceRow as PresetRow).household_id,
      ledgerId: (sourceRow as PresetRow).ledger_id,
      createdBy: input.createdBy,
      preset: duplicated,
      isDefault: false,
    });

    const { data, error } = await supabase.from("category_split_presets").insert(payload).select(selectColumns).single();
    if (error) fail(error, "プリセット複製の保存に失敗しました");
    return toCategorySplitPreset(data as PresetRow);
  },

  async archiveCategorySplitPreset(id) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    const { error } = await supabase.from("category_split_presets").update({ status: "archived" }).eq("id", id);
    if (error) fail(error, "プリセットのアーカイブに失敗しました");
  },

  async updateCategorySplitPresetStatus(input) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    const { error } = await supabase.from("category_split_presets").update({ status: input.status }).eq("id", input.id);
    if (error) fail(error, "状態変更に失敗しました");
  },

  async updateCategorySplitPresetPriority(input) {
    const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
    const { error } = await supabase.from("category_split_presets").update({ priority: input.priority }).eq("id", input.id);
    if (error) fail(error, "優先度の更新に失敗しました");
  },
});
