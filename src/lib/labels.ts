// Libellés français des valeurs stockées en base (types énumérés du schéma).

export const clientTypes = {
  particulier: "Particulier",
  professionnel: "Professionnel",
} as const;

export const buildingTypes = {
  maison: "Maison",
  appartement: "Appartement",
  commerce: "Commerce",
  bureau: "Bureau",
  autre: "Autre",
} as const;

export const requestServices = {
  installation_neuve: "Installation neuve",
  renovation: "Rénovation",
  mise_aux_normes: "Mise aux normes",
  tableau_electrique: "Tableau électrique",
  videosurveillance: "Vidéosurveillance",
  interphonie: "Interphonie",
  vmc: "VMC",
  autre: "Autre",
} as const;

export const allServices = { ...requestServices, depannage: "Dépannage" } as const;

export const urgencyLevels = {
  normale: "Dans les prochains jours",
  urgente: "Aujourd'hui si possible",
  tres_urgente: "Urgent : plus de courant ou danger",
} as const;

export const failureNatures = [
  "Coupure totale de courant",
  "Le disjoncteur saute",
  "Une partie de la maison ou du local sans courant",
  "Prise ou interrupteur en panne",
  "Éclairage en panne",
  "Odeur de brûlé ou échauffement",
  "Autre",
] as const;

export const requestStatuses = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  devis_cree: "Devis créé",
  planifiee: "Planifiée",
  sans_suite: "Sans suite",
  archivee: "Archivée",
} as const;

export type ClientType = keyof typeof clientTypes;
export type BuildingType = keyof typeof buildingTypes;
export type RequestService = keyof typeof requestServices;
export type UrgencyLevel = keyof typeof urgencyLevels;
export type RequestStatus = keyof typeof requestStatuses;

export function keysOf<T extends Record<string, string>>(o: T) {
  return Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}
