// Variables publiques : lues explicitement pour que Next.js les intègre au build.
// Tolère une URL collée avec « /rest/v1/ » ou des espaces : seule l'origine compte.
export function normalizeSupabaseUrl(raw: string | undefined) {
  return (raw ?? "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

export function assertSupabaseEnv() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (voir .env.example).",
    );
  }
}
