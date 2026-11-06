import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Envoi via l'API HTTP de Resend (pas de dépendance supplémentaire).
// Sans RESEND_API_KEY, l'envoi est ignoré : les demandes restent enregistrées dans l'admin.
// Sans domaine vérifié, Resend n'accepte que l'expéditeur onboarding@resend.dev
// et n'envoie qu'à l'adresse du compte Resend.

const DEFAULT_FROM = "Électricité N.A.B. <onboarding@resend.dev>";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function canEmailCustomers() {
  // Les e-mails aux clients exigent un domaine vérifié chez Resend (RESEND_FROM renseigné).
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  template: string;
  entity?: string;
  entityId?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false as const, reason: "RESEND_API_KEY absente" };

  let resendId: string | null = null;
  let error: string | null = null;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (res.ok) resendId = body.id ?? null;
    else error = `${res.status} ${body.message ?? ""}`.trim();
  } catch (e) {
    error = e instanceof Error ? e.message : "erreur réseau";
  }

  try {
    await createAdminClient()
      .from("email_log")
      .insert({
        template: params.template,
        recipient: params.to,
        entity: params.entity ?? null,
        entity_id: params.entityId ?? null,
        resend_id: resendId,
        status: error ? "erreur" : "envoye",
        error,
      });
  } catch {
    // Le journal ne doit jamais bloquer l'envoi.
  }

  if (error) console.error("[e-mail]", params.template, error);
  return error ? { sent: false as const, reason: error } : { sent: true as const };
}
