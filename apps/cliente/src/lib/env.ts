// Le as variaveis VITE_* do ambiente. Validacoes acontecem no @credshow/lib quando se usa o getSupabase.
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
};

export function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("t");
}
