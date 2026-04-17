import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@credshow/types/database";

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY sao obrigatorios");
  }
  _client = createClient<Database>(url, key);
  return _client;
}

export type { Database };
