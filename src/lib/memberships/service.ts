import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { MemberOption } from "@/types/domain";

import { toMemberOptions } from "@/lib/memberships/format";

export const listMembersByHouseholdId = async (householdId: string): Promise<MemberOption[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("memberships")
    .select("id,user_id,role,users!inner(display_name)")
    .eq("household_id", householdId)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`メンバー一覧の取得に失敗しました: ${error.message}`);
  }

  return toMemberOptions((data ?? []) as { id: string; user_id: string; role: string; users: { display_name: string | null } | { display_name: string | null }[] }[]);
};
