import type { MetadataRoute } from "next";
import { services, siteUrl } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/a-propos",
    "/prestations",
    "/realisations",
    "/zone-intervention",
    "/contact",
    "/devis",
    "/depannage",
    "/mentions-legales",
    "/politique-de-confidentialite",
  ];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, lastModified: new Date() })),
    ...services.map((s) => ({ url: `${siteUrl}/prestations/${s.slug}`, lastModified: new Date() })),
  ];
}
