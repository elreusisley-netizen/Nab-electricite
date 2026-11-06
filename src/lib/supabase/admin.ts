import "server-only";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseUrl } from "@/lib/env";

// Client avec la clé secrète : contourne la RLS.
// Réservé au serveur (formulaires publics validés, tâches planifiées). Ne jamais l'importer côté client.
export function createAdminClient() {
  assertSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("Variable SUPABASE_SECRET_KEY manquante (voir .env.example).");

  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
