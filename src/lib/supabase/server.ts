import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("Supabaseの環境変数が未設定です。.env.example を確認してください。");
}

const parseAuthTokenCookie = (rawValue: string): string | null => {
  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded) as unknown;

    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      return parsed[0];
    }

    if (parsed && typeof parsed === "object" && "access_token" in parsed) {
      const token = (parsed as { access_token?: unknown }).access_token;
      return typeof token === "string" ? token : null;
    }
  } catch {
    return null;
  }

  return null;
};

export const createServerSupabaseClient = (accessToken?: string | null) =>
  createClient(url ?? "", anonKey ?? "", {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

export const getAccessTokenFromCookies = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const authTokenCookie = cookieStore.getAll().find((cookie) => cookie.name.endsWith("-auth-token"));

  if (!authTokenCookie?.value) {
    return null;
  }

  return parseAuthTokenCookie(authTokenCookie.value);
};
