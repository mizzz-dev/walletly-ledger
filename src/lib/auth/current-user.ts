import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";

const fallbackUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID;

export interface CurrentUserResult {
  userId: string | null;
  isFallback: boolean;
}

export const resolveCurrentUser = async (): Promise<CurrentUserResult> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      return { userId: data.user.id, isFallback: false };
    }
  }

  if (fallbackUserId) {
    return { userId: fallbackUserId, isFallback: true };
  }

  return { userId: null, isFallback: false };
};
