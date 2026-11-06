"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { z } from "zod";
import { canEmailCustomers, escapeHtml, sendEmail } from "@/lib/email";
import { allServices, buildingTypes, clientTypes, urgencyLevels } from "@/lib/labels";
import { MAX_PHOTOS, requestSchema, type CreateRequestResult } from "@/lib/requests-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { company, siteUrl } from "@/content/site";

const BUCKET = "request-photos";
const MAX_REQUESTS_PER_HOUR = 5;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || process.env.SUPABASE_SECRET_KEY || "nab";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

// 1. Valide et enregistre la demande, puis renvoie des autorisations d'envoi pour les photos.
export async function createRequest(input: unknown): Promise<CreateRequestResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Certains champs sont à corriger.", fieldErrors };
  }
  const data = parsed.data;

  // Champ piège rempli : un robot. On répond comme si tout allait bien, sans rien enregistrer.
  if (data.website) return { ok: true, requestId: randomUUID(), uploads: [] };

  const ip = await clientIp();
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return { ok: false, error: "La vérification anti-robot a échoué. Rechargez la page et réessayez." };
  }

  const db = createAdminClient();
  const ipHash = hashIp(ip);

  if (ipHash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("received_at", since);
    if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
      return { ok: false, error: `Trop de demandes envoyées. Appelez-nous directement au ${company.phone}.` };
    }
  }

  // Rattache la demande à une fiche client existante (même e-mail), sans en créer de nouvelle ici.
  const { data: existingClient } = await db.from("clients").select("id").eq("email", data.email).maybeSingle();

  const row: Record<string, unknown> = {
    kind: data.kind,
    client_id: existingClient?.id ?? null,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    address_line: data.addressLine,
    postal_code: data.postalCode,
    city: data.city,
    description: data.description,
    consent_at: new Date().toISOString(),
    ip_hash: ipHash,
  };
  if (data.kind === "devis") {
    row.client_type = data.clientType;
    row.building_type = data.buildingType;
    row.service = data.service;
  } else {
    row.failure_nature = data.failureNature;
    row.urgency = data.urgency;
    row.service = "depannage";
  }

  const { data: inserted, error } = await db.from("requests").insert(row).select("id").single();
  if (error || !inserted) {
    console.error("[demande] insertion", error?.message);
    return { ok: false, error: `L'envoi a échoué. Réessayez ou appelez-nous au ${company.phone}.` };
  }
  const requestId = inserted.id as string;

  const uploads: { path: string; token: string }[] = [];
  for (let i = 0; i < Math.min(data.photoCount, MAX_PHOTOS); i++) {
    const path = `${requestId}/${i + 1}-${randomUUID()}.jpg`;
    const { data: signed } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (signed?.token) uploads.push({ path, token: signed.token });
  }

  await notify(requestId, data);

  return { ok: true, requestId, uploads };
}

// 2. Après l'envoi des photos par le navigateur : vérifie qu'elles existent et les rattache à la demande.
export async function confirmPhotos(requestId: string, paths: string[]) {
  if (!/^[0-9a-f-]{36}$/.test(requestId) || !Array.isArray(paths)) return { ok: false };

  const db = createAdminClient();
  const { data: request } = await db.from("requests").select("id, received_at").eq("id", requestId).maybeSingle();
  if (!request) return { ok: false };
  if (Date.now() - new Date(request.received_at as string).getTime() > 30 * 60 * 1000) return { ok: false };

  const { data: objects } = await db.storage.from(BUCKET).list(requestId, { limit: MAX_PHOTOS + 5 });
  const byName = new Map<string, { metadata?: Record<string, unknown> | null }>();
  for (const o of objects ?? []) byName.set(o.name, o);

  const rows = paths
    .filter((p) => typeof p === "string" && p.startsWith(`${requestId}/`))
    .slice(0, MAX_PHOTOS)
    .map((p) => ({ path: p, object: byName.get(p.slice(requestId.length + 1)) }))
    .filter((x) => x.object)
    .map((x) => {
      const meta = (x.object?.metadata ?? {}) as { size?: number; mimetype?: string };
      return {
        bucket: BUCKET,
        path: x.path,
        category: "photo_demande" as const,
        request_id: requestId,
        mime_type: meta.mimetype ?? "image/jpeg",
        size_bytes: Math.max(1, Math.min(meta.size ?? 1, 10485760)),
      };
    });

  if (rows.length === 0) return { ok: true, count: 0 };
  const { error } = await db.from("files").upsert(rows, { onConflict: "bucket,path", ignoreDuplicates: true });
  if (error) console.error("[demande] photos", error.message);
  return { ok: !error, count: rows.length };
}

type ParsedRequest = z.infer<typeof requestSchema>;

async function notify(requestId: string, data: ParsedRequest) {
  const to = process.env.NOTIFICATION_EMAIL || company.email;
  const isDepannage = data.kind === "depannage";
  const lines: [string, string][] = [
    ["Nom", `${data.firstName} ${data.lastName}`],
    ["Téléphone", data.phone],
    ["E-mail", data.email],
    ["Adresse", `${data.addressLine}, ${data.postalCode} ${data.city}`],
    ...(data.kind === "devis"
      ? ([
          ["Client", clientTypes[data.clientType]],
          ["Bâtiment", buildingTypes[data.buildingType]],
          ["Prestation", allServices[data.service]],
        ] as [string, string][])
      : ([
          ["Panne", data.failureNature],
          ["Urgence", urgencyLevels[data.urgency]],
        ] as [string, string][])),
    ["Photos", String(data.photoCount)],
  ];

  const rowsHtml = lines
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5a6577">${escapeHtml(k)}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join("");

  const subject = isDepannage
    ? `${data.kind === "depannage" && data.urgency === "tres_urgente" ? "URGENT — " : ""}Nouveau dépannage : ${data.city}`
    : `Nouvelle demande de devis : ${data.city}`;

  await sendEmail({
    to,
    subject,
    template: isDepannage ? "notif_depannage" : "notif_devis",
    entity: "requests",
    entityId: requestId,
    replyTo: data.email,
    html: `<div style="font-family:Arial,sans-serif;color:#1b2433">
      <h2 style="color:#0e2240">${escapeHtml(subject)}</h2>
      <table>${rowsHtml}</table>
      <p style="margin-top:16px"><strong>Description</strong><br>${escapeHtml(data.description).replace(/\n/g, "<br>")}</p>
      <p style="margin-top:24px"><a href="${siteUrl}/admin/demandes/${requestId}" style="background:#d2232a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Ouvrir dans l'admin</a></p>
    </div>`,
  });

  if (canEmailCustomers()) {
    await sendEmail({
      to: data.email,
      subject: isDepannage ? "Votre demande de dépannage est bien reçue" : "Votre demande de devis est bien reçue",
      template: isDepannage ? "confirmation_depannage" : "confirmation_devis",
      entity: "requests",
      entityId: requestId,
      replyTo: company.email,
      html: `<div style="font-family:Arial,sans-serif;color:#1b2433">
        <p>Bonjour ${escapeHtml(data.firstName)},</p>
        <p>Nous avons bien reçu votre demande et nous revenons vers vous rapidement.</p>
        ${isDepannage ? `<p>Pour une urgence, appelez-nous directement au <strong>${company.phone}</strong>.</p>` : ""}
        <p>Électricité N.A.B.<br>${company.phone} · ${company.email}</p>
      </div>`,
    });
  }
}
