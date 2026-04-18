function assertEnv(key: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }
  return value;
}

export const SUPABASE_URL = assertEnv(
  "VITE_SUPABASE_URL",
  import.meta.env.VITE_SUPABASE_URL as string | undefined
);

export const SUPABASE_ANON_KEY = assertEnv(
  "VITE_SUPABASE_ANON_KEY",
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
);

export const PROMOTOR_BASE_URL =
  (import.meta.env.VITE_PROMOTOR_BASE_URL as string | undefined)?.trim() ||
  "https://inovagroup00.github.io/terracred/promotor";
