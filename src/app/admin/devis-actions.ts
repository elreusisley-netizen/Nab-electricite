"use server";

import { z } from "zod";
import { siteUrl } from "@/content/site";
import { requireAdmin } from "@/lib/auth";
import { canEmailCustomers, escapeHtml, sendEmail } from "@/lib/email";

type SendResult =
  | { ok: true; link: string; emailed: boolean; emailNote: string | null; number: string }
  | { ok: false; error: string };

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/**
 * Envoie un devis : brouillon → « envoyé » (numéro attribué par la base),
 * puis e-mail au client avec le lien de consultation si l'envoi d'e-mails est configuré.
 * Utilisable aussi pour renvoyer le lien d'un devis déjà envoyé.
 */
export async function sendQuote(quoteId: string): Promise<SendResult> {
  const id = z.string().uuid().safeParse(quoteId);
  if (!id.success) return { ok: false, error: "Devis introuvable." };
  const { supabase } = await requireAdmin();

  const { data: current, error: readError } = await supabase.from("quotes").select("status").eq("id", id.data).single();
  if (readError || !current) return { ok: false, error: "Devis introuvable." };
  if (current.status === "brouillon") {
    const { error } = await supabase.from("quotes").update({ status: "envoye" }).eq("id", id.data);
    if (error) return { ok: false, error: error.message };
  } else if (current.status !== "envoye") {
    return { ok: false, error: "Seul un devis brouillon ou envoyé peut être transmis au client." };
  }

  const { data: q, error } = await supabase
    .from("quotes")
    .select("number, title, public_token, total_ttc_cents, valid_until, clients ( first_name, last_name, company_name, type, email )")
    .eq("id", id.data)
    .single();
  if (error || !q) return { ok: false, error: error?.message ?? "Devis introuvable." };

  const quote = q as unknown as {
    number: string;
    title: string | null;
    public_token: string;
    total_ttc_cents: number;
    valid_until: string | null;
    clients: { first_name: string | null; last_name: string | null; company_name: string | null; type: string; email: string | null } | null;
  };
  const link = `${siteUrl}/devis/${quote.public_token}`;
  const to = quote.clients?.email ?? null;

  let emailed = false;
  let emailNote: string | null = null;
  if (!to) {
    emailNote = "Pas d'e-mail sur la fiche client : copiez le lien et envoyez-le par SMS.";
  } else if (!canEmailCustomers()) {
    emailNote = "L'envoi d'e-mails n'est pas encore configuré : copiez le lien et envoyez-le vous-même.";
  } else {
    const name =
      quote.clients?.type === "professionnel" && quote.clients.company_name
        ? quote.clients.company_name
        : [quote.clients?.first_name, quote.clients?.last_name].filter(Boolean).join(" ");
    const validity = quote.valid_until ? new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("fr-FR") : null;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#1d2433;max-width:560px">
        <p>Bonjour${name ? ` ${escapeHtml(name)}` : ""},</p>
        <p>Veuillez trouver votre devis <strong>${escapeHtml(quote.number)}</strong>${quote.title ? ` — ${escapeHtml(quote.title)}` : ""},
        d'un montant de <strong>${eur.format(Number(quote.total_ttc_cents) / 100)} TTC</strong>.</p>
        <p><a href="${link}" style="display:inline-block;background:#0e2240;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Consulter le devis</a></p>
        <p>Depuis cette page, vous pouvez l'enregistrer en PDF, l'imprimer ou l'accepter en ligne (« Bon pour accord »).${validity ? ` Il est valable jusqu'au ${validity}.` : ""}</p>
        <p>Pour toute question, répondez simplement à cet e-mail ou appelez le 06 66 61 43 73.</p>
        <p>Cordialement,<br>Électricité N.A.B.</p>
      </div>`;
    const res = await sendEmail({
      to,
      subject: `Votre devis ${quote.number} — Électricité N.A.B.`,
      html,
      replyTo: process.env.NOTIFICATION_EMAIL || undefined,
      template: "devis_client",
      entity: "quote",
      entityId: id.data,
    });
    emailed = res.sent;
    if (!res.sent) emailNote = "L'e-mail n'a pas pu partir : copiez le lien et envoyez-le vous-même.";
  }

  return { ok: true, link, emailed, emailNote, number: quote.number };
}
