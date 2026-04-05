"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("Supabaseの環境変数が未設定です。.env.example を確認してください。");
}

export const createBrowserSupabaseClient = () => createClient(url ?? "", anonKey ?? "");
