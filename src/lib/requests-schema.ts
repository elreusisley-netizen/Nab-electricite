import { z } from "zod";
import { buildingTypes, clientTypes, keysOf, requestServices, urgencyLevels } from "@/lib/labels";

export const MAX_PHOTOS = 5;

const base = {
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().toLowerCase().email("E-mail invalide").max(200),
  phone: z
    .string()
    .trim()
    .min(10, "Téléphone invalide")
    .max(25)
    .regex(/^[0-9+().\s-]+$/, "Téléphone invalide"),
  addressLine: z.string().trim().min(3, "Adresse requise").max(200),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal à 5 chiffres"),
  city: z.string().trim().min(1, "Ville requise").max(100),
  description: z.string().trim().min(10, "Décrivez votre besoin en quelques mots (10 caractères minimum)").max(5000),
  consent: z.literal(true, { errorMap: () => ({ message: "Votre accord est nécessaire pour traiter la demande" }) }),
  photoCount: z.number().int().min(0).max(MAX_PHOTOS),
  website: z.string().max(200).optional(), // champ piège anti-robot, invisible pour les humains
  turnstileToken: z.string().max(4096).optional(),
};

export const devisSchema = z.object({
  ...base,
  kind: z.literal("devis"),
  clientType: z.enum(keysOf(clientTypes)),
  buildingType: z.enum(keysOf(buildingTypes)),
  service: z.enum(keysOf(requestServices)),
});

export const depannageSchema = z.object({
  ...base,
  kind: z.literal("depannage"),
  failureNature: z.string().trim().min(1, "Indiquez la nature de la panne").max(120),
  urgency: z.enum(keysOf(urgencyLevels)),
});

export const requestSchema = z.discriminatedUnion("kind", [devisSchema, depannageSchema]);

export type RequestInput = z.input<typeof requestSchema>;

export type CreateRequestResult =
  | { ok: true; requestId: string; uploads: { path: string; token: string }[] }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
