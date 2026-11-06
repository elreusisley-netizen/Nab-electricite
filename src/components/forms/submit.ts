"use client";

import { createClient } from "@supabase/supabase-js";
import { confirmPhotos, createRequest } from "@/app/(site)/demande-actions";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";
import type { CreateRequestResult, RequestInput } from "@/lib/requests-schema";

// Redimensionne et ré-encode en JPEG dans le navigateur.
// Effet utile : les métadonnées EXIF (dont la position GPS) disparaissent.
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compression"))), "image/jpeg", quality),
  );
}

export type SubmitOutcome =
  | { ok: true; photosSent: number; photosFailed: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitRequest(input: RequestInput, photos: File[]): Promise<SubmitOutcome> {
  // On prépare les photos avant l'envoi pour ne demander que les autorisations utiles.
  const blobs: Blob[] = [];
  let photosFailed = 0;
  for (const file of photos) {
    try {
      blobs.push(await compressImage(file));
    } catch {
      photosFailed++;
    }
  }

  let result: CreateRequestResult;
  try {
    result = await createRequest({ ...input, photoCount: blobs.length });
  } catch {
    return { ok: false, error: "Connexion impossible. Vérifiez votre réseau et réessayez." };
  }
  if (!result.ok) return result;
  if (result.uploads.length === 0) return { ok: true, photosSent: 0, photosFailed };

  const storage = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from("request-photos");

  const sent: string[] = [];
  await Promise.all(
    result.uploads.map(async (u, i) => {
      const blob = blobs[i];
      if (!blob) return;
      const { error } = await storage.uploadToSignedUrl(u.path, u.token, blob, { contentType: "image/jpeg" });
      if (error) photosFailed++;
      else sent.push(u.path);
    }),
  );

  if (sent.length > 0) {
    try {
      await confirmPhotos(result.requestId, sent);
    } catch {
      // La demande est enregistrée ; seules les photos manqueront.
    }
  }
  return { ok: true, photosSent: sent.length, photosFailed };
}
