import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export const createSupabaseClient = createBrowserSupabaseClient;
export const supabase = createSupabaseClient();
