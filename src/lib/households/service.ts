import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { HouseholdOption } from "@/types/domain";

export const listHouseholdsByUserId = async (userId: string): Promise<HouseholdOption[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("memberships")
    .select("household_id, households!inner(id,name)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`世帯一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const household = Array.isArray(row.households) ? row.households[0] : row.households;
    return {
      id: household.id,
      name: household.name,
    };
  });
};
