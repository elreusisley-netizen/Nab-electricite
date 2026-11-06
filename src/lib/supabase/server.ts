import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { assertSupabaseEnv, supabasePublishableKey, supabaseUrl } from "@/lib/env";

// Client lié à la session de l'utilisateur connecté : les politiques RLS s'appliquent.
export async function createClient() {
  // cookies() en premier : la page devient dynamique, jamais pré-générée au build.
  const cookieStore = await cookies();
  assertSupabaseEnv();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le middleware rafraîchit la session.
        }
      },
    },
  });
}
