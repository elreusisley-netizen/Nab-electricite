import type { BuildingType, ClientType, RequestService, RequestStatus, UrgencyLevel } from "@/lib/labels";

export type InterventionStatus = "a_planifier" | "planifiee" | "en_cours" | "attente_materiel" | "terminee" | "annulee";

export const INTERVENTION_STATUS: Record<InterventionStatus, string> = {
  a_planifier: "À planifier",
  planifiee: "Planifiée",
  en_cours: "En cours",
  attente_materiel: "Attente matériel",
  terminee: "Terminée",
  annulee: "Annulée",
};

/** Statuts proposés dans la fiche d'un créneau d'agenda (« à planifier » n'a pas de date). */
export const SLOT_STATUSES: InterventionStatus[] = ["planifiee", "en_cours", "attente_materiel", "terminee", "annulee"];

/** Interventions qui occupent réellement le planning à venir. */
export const ACTIVE_STATUSES: InterventionStatus[] = ["planifiee", "en_cours", "attente_materiel"];

export type ServiceKey = RequestService | "depannage";

/** Un créneau de l'agenda : une intervention planifiée ou une indisponibilité. */
export interface AgendaItem {
  id: string; // id du créneau (schedule_events)
  kind: "intervention" | "blocage";
  date: string; // AAAA-MM-JJ (heure locale)
  start: string; // HH:MM
  end: string; // HH:MM
  note: string | null;
  intervention: {
    id: string;
    title: string;
    service: ServiceKey;
    status: InterventionStatus;
    description: string | null;
    internalNotes: string | null;
    requestId: string | null;
    client: {
      id: string;
      type: ClientType;
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
      phone: string | null;
      email: string | null;
    };
    site: { id: string; addressLine: string; postalCode: string; city: string } | null;
  } | null;
}

/** Contenu de la fiche (création ou modification). */
export interface SlotInput {
  slotId?: string;
  kind: "intervention" | "blocage";
  date: string;
  start: string;
  end: string;
  note: string;
  // Intervention
  interventionId?: string;
  clientId?: string;
  siteId?: string;
  requestId?: string | null;
  quoteId?: string | null;
  title: string;
  service: ServiceKey | "";
  status: InterventionStatus;
  description: string;
  internalNotes: string;
  clientType: ClientType;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  addressLine: string;
  postalCode: string;
  city: string;
}

export const emptySlot = (date: string, kind: "intervention" | "blocage" = "intervention"): SlotInput => ({
  kind,
  date,
  start: kind === "blocage" ? "08:00" : "08:00",
  end: kind === "blocage" ? "18:00" : "12:00",
  note: "",
  requestId: null,
  title: "",
  service: "",
  status: "planifiee",
  description: "",
  internalNotes: "",
  clientType: "particulier",
  firstName: "",
  lastName: "",
  companyName: "",
  phone: "",
  email: "",
  addressLine: "",
  postalCode: "",
  city: "",
});

/** Une demande reçue par le site (table requests). */
export interface RequestItem {
  id: string;
  kind: "devis" | "depannage";
  status: RequestStatus;
  clientType: ClientType | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine: string;
  postalCode: string;
  city: string;
  buildingType: BuildingType | null;
  service: ServiceKey | null;
  failureNature: string | null;
  urgency: UrgencyLevel | null;
  description: string;
  receivedAt: string;
  clientId: string | null;
}

/** Intervention minimale pour les statistiques. */
export interface StatIntervention {
  service: ServiceKey;
  status: InterventionStatus;
  clientType: ClientType;
  createdAt: string;
  completedAt: string | null;
}
