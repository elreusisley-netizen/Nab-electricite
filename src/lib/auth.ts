import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// À appeler en tête de chaque page et action de l'admin.
// Renvoie le client Supabase de la session et l'utilisateur, ou redirige vers la connexion.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/connexion");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) {
    // Pas de déconnexion ici : un composant serveur ne peut pas écrire les cookies.
    redirect("/admin/connexion?erreur=acces");
  }

  return { supabase, user };
}
