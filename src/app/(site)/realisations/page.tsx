import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, Container, PageHero } from "@/components/site/ui";
import { getRealisations } from "@/lib/content";

export const metadata: Metadata = {
  title: "Réalisations",
  description:
    "Chantiers réalisés par Électricité N.A.B. : éclairage de commerces et de restaurants, bureaux, constructions neuves, coffrets de comptage.",
};

export default function RealisationsPage() {
  const realisations = getRealisations();

  return (
    <>
      <PageHero
        eyebrow="Réalisations"
        title="Nos chantiers en images"
        intro="Commerces, restaurants, bureaux et logements : quelques-unes de nos interventions."
      />
      <section>
        <Container className="py-20">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {realisations.map((r) => (
              <figure key={r.src}>
                <div className="relative h-72 overflow-hidden rounded-xl bg-fond">
                  <Image
                    src={r.src}
                    alt={r.alt}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 font-semibold text-nuit">{r.caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-xl bg-fond p-8">
            <p className="font-titre text-2xl font-bold text-nuit">Un projet similaire ?</p>
            <ButtonLink href="/devis">Demander un devis</ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
