// Point d'accès unique au contenu du site public.
// Aujourd'hui : fichier src/content/site.ts. Phase 7 : requêtes Supabase (contenu publié).
import { company, departments, realisations, references, services, type Service } from "@/content/site";

export function getCompany() {
  return company;
}

export function getServices(): Service[] {
  return services;
}

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getRealisations() {
  return realisations;
}

export function getReferences() {
  return references;
}

export function getDepartments() {
  return departments;
}
