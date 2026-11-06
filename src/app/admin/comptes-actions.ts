"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountRow = {
  email: string;
  fullName: string;
  hasAccount: boolean;
  confirmed: boolean;
  lastSignIn: string | null;
  isMe: boolean;
};

type Result = { ok: true; message: string } | { ok: false; error: string };

const emailSchema = z.string().trim().toLowerCase().email("Adresse e-mail invalide");
const passwordSchema = z.string().min(8, "Mot de passe : 8 caractères minimum").max(72);

export async function listAccounts(): Promise<AccountRow[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_accounts");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    email: String(r.email),
    fullName: String(r.full_name ?? ""),
    hasAccount: Boolean(r.compte_cree),
    confirmed: Boolean(r.confirme),
    lastSignIn: (r.derniere_connexion as string | null) ?? null,
    isMe: Boolean(r.est_moi),
  }));
}

async function findUserId(email: string) {
  const admin = createAdminClient();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

// Ajoute une adresse administrateur et, si un mot de passe est donné, crée le compte (déjà confirmé).
export async function addAdmin(input: { email: string; fullName: string; password?: string }): Promise<Result> {
  const { supabase } = await requireAdmin();
  const email = emailSchema.safeParse(input.email);
  if (!email.success) return { ok: false, error: email.error.issues[0]?.message ?? "Adresse invalide" };

  const { error } = await supabase.rpc("add_admin_email", { p_email: email.data, p_name: input.fullName });
  if (error) return { ok: false, error: error.message };

  if (input.password) {
    const pwd = passwordSchema.safeParse(input.password);
    if (!pwd.success) return { ok: false, error: pwd.error.issues[0]?.message ?? "Mot de passe invalide" };
    const existing = await findUserId(email.data);
    if (existing) return { ok: true, message: "Adresse ajoutée. Le compte existait déjà : il est maintenant administrateur." };
    const { error: createError } = await createAdminClient().auth.admin.createUser({
      email: email.data,
      password: pwd.data,
      email_confirm: true,
    });
    if (createError) return { ok: false, error: `Adresse ajoutée, mais compte non créé : ${createError.message}` };
    return { ok: true, message: "Compte administrateur créé. Il peut se connecter tout de suite." };
  }
  return { ok: true, message: "Adresse ajoutée. Le compte sera administrateur dès sa création." };
}

export async function setPassword(input: { email: string; password: string }): Promise<Result> {
  await requireAdmin();
  const email = emailSchema.safeParse(input.email);
  const pwd = passwordSchema.safeParse(input.password);
  if (!email.success) return { ok: false, error: "Adresse invalide" };
  if (!pwd.success) return { ok: false, error: pwd.error.issues[0]?.message ?? "Mot de passe invalide" };

  const id = await findUserId(email.data);
  if (!id) return { ok: false, error: "Aucun compte avec cette adresse." };
  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password: pwd.data, email_confirm: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Mot de passe modifié." };
}

export async function removeAdmin(email: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("remove_admin_email", { p_email: email });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Accès administrateur retiré." };
}
