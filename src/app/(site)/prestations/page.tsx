import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Container, DepannageBand, PageHero } from "@/components/site/ui";
import { getServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Prestations",
  description:
    "Installation électrique neuve, rénovation, mise aux normes NF C 15-100, tableau électrique, dépannage 7j/7, vidéosurveillance, interphonie et VMC à Bordeaux et en Nouvelle-Aquitaine.",
};

export default function ServicesPage() {
  const services = getServices();

  return (
    <>
      <PageHero
        eyebrow="Prestations"
        title="Tous vos travaux électriques"
        intro="Pour les particuliers comme pour les professionnels, en Gironde et dans toute la Nouvelle-Aquitaine."
      />
      <section>
        <Container className="py-20">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/prestations/${s.slug}`}
                  className="flex h-full flex-col rounded-xl border border-ligne bg-white p-7 transition hover:border-nuit hover:shadow-sm"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                      s.icon === "bolt" ? "bg-rouge text-white" : "bg-fond text-nuit"
                    }`}
                  >
                    <Icon name={s.icon} size={28} strokeWidth={1.7} />
                  </span>
                  <h2 className="mt-5 font-titre text-2xl font-bold text-nuit">{s.title}</h2>
                  <p className="mt-2 flex-1 text-texte">{s.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-semibold text-rouge-fonce">
                    En savoir plus <Icon name="arrow" size={18} strokeWidth={2} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <DepannageBand />
    </>
  );
}
