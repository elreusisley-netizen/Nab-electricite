"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

let client: SupabaseClient | null = null;

// Client navigateur de l'admin : même session (cookies) que le serveur, soumis aux règles RLS.
export function getBrowserClient(): SupabaseClient {
  if (!client) client = createBrowserClient(supabaseUrl, supabasePublishableKey);
  return client;
}
