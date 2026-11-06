import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileCallBar } from "@/components/site/MobileCallBar";
import { company, departments, services, siteUrl } from "@/content/site";

// Données structurées pour le référencement local (Schema.org Electrician).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Electrician",
  name: company.displayName,
  legalName: `EURL ${company.legalName}`,
  url: siteUrl,
  telephone: company.phoneIntl,
  email: company.email,
  image: `${siteUrl}/images/realisations/showroom-cuisine.jpg`,
  vatID: company.vatNumber.replace(/\s/g, ""),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bordeaux",
    postalCode: "33100",
    addressRegion: "Nouvelle-Aquitaine",
    addressCountry: "FR",
  },
  areaServed: [
    { "@type": "AdministrativeArea", name: "Nouvelle-Aquitaine" },
    ...departments.map((d) => ({ "@type": "AdministrativeArea", name: d.name })),
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Prestations",
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title, url: `${siteUrl}/prestations/${s.slug}` },
    })),
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <MobileCallBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
