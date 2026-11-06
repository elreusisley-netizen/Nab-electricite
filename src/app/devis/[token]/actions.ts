"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, sendEmail } from "@/lib/email";

export type AcceptState = { ok: boolean; error?: string } | null;

const schema = z.object({
  token: z.string().uuid(),
  name: z.string().trim().min(3, "Indiquez vos nom et prénom.").max(120),
  agree: z.literal("on", { errorMap: () => ({ message: "Cochez la case « Bon pour accord »." }) }),
});

/** Acceptation en ligne d'un devis envoyé (« Bon pour accord »). */
export async function acceptQuote(_prev: AcceptState, form: FormData): Promise<AcceptState> {
  const parsed = schema.safeParse({ token: form.get("token"), name: form.get("name"), agree: form.get("agree") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };

  const sb = createAdminClient();
  const { data: q } = await sb
    .from("quotes")
    .select("id, number, status, valid_until, total_ttc_cents")
    .eq("public_token", parsed.data.token)
    .maybeSingle();
  if (!q) return { ok: false, error: "Devis introuvable." };
  if (q.status === "accepte") return { ok: true };
  if (q.status !== "envoye") return { ok: false, error: "Ce devis ne peut plus être accepté en ligne. Contactez-nous." };
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  if (q.valid_until && q.valid_until < today) return { ok: false, error: "La validité de ce devis est dépassée. Contactez-nous pour le mettre à jour." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "inconnue";
  const ipHash = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SECRET_KEY ?? ""}`).digest("hex");

  const { error } = await sb
    .from("quotes")
    .update({ status: "accepte", accepted_by_name: parsed.data.name, accepted_ip_hash: ipHash })
    .eq("id", q.id)
    .eq("status", "envoye");
  if (error) return { ok: false, error: "L'acceptation n'a pas pu être enregistrée. Réessayez ou appelez-nous." };

  const to = process.env.NOTIFICATION_EMAIL;
  if (to) {
    const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(q.total_ttc_cents) / 100);
    await sendEmail({
      to,
      subject: `Devis ${q.number} accepté en ligne`,
      html: `<p>Le devis <strong>${escapeHtml(q.number ?? "")}</strong> (${amount} TTC) vient d'être accepté en ligne par <strong>${escapeHtml(parsed.data.name)}</strong>.</p><p>Planifiez l'intervention depuis l'espace admin, onglet Devis.</p>`,
      template: "devis_accepte_admin",
      entity: "quote",
      entityId: q.id,
    });
  }
  return { ok: true };
}
