"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/connexion?erreur=format");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Visible dans Vercel > Logs (jamais le mot de passe).
    console.error("[connexion admin]", error.code ?? "", error.status ?? "", error.message);
    if (error.code === "email_not_confirmed") redirect("/admin/connexion?erreur=non-confirme");
    if (error.code === "invalid_credentials") redirect("/admin/connexion?erreur=identifiants");
    const detail = [error.code, error.status, error.message].filter(Boolean).join(" · ").slice(0, 160);
    redirect(`/admin/connexion?erreur=technique&detail=${encodeURIComponent(detail)}`);
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/connexion");
}
