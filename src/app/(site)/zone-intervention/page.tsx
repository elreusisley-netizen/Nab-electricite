import type { Metadata } from "next";
import { ContactChoices, Container, Eyebrow, H2, PageHero } from "@/components/site/ui";
import { getDepartments } from "@/lib/content";

export const metadata: Metadata = {
  title: "Zone d'intervention",
  description:
    "Électricien basé à Bordeaux, Électricité N.A.B. intervient en Gironde et dans toute la Nouvelle-Aquitaine pour les particuliers et les professionnels.",
};

export default function ZonePage() {
  const departments = getDepartments();

  return (
    <>
      <PageHero
        eyebrow="Zone d'intervention"
        title="Bordeaux, la Gironde et toute la Nouvelle-Aquitaine"
        intro="Nous sommes basés à Bordeaux et intervenons sur l'ensemble de la région, pour les particuliers comme pour les professionnels."
      />
      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Où intervenons-nous ?</Eyebrow>
            <H2>Les 12 départements de Nouvelle-Aquitaine</H2>
            <p className="mt-5 text-texte">
              La Gironde et l'agglomération bordelaise sont notre secteur principal. Pour un chantier plus éloigné,
              indiquez simplement l'adresse dans votre demande : nous vous répondons sur la faisabilité et les frais de
              déplacement éventuels, détaillés dans le devis.
            </p>
            <p className="mt-4 text-texte">
              Les commerces et entreprises présents sur plusieurs sites de la région peuvent nous confier l'ensemble de
              leurs interventions.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 self-start text-[15px] sm:grid-cols-3">
            {departments.map((d, i) => (
              <li
                key={d.code}
                className={i === 0 ? "rounded-lg bg-nuit px-4 py-3 font-semibold text-white" : "rounded-lg border border-ligne px-4 py-3"}
              >
                {d.name} ({d.code})
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section className="bg-fond">
        <Container className="py-20">
          <H2>Contactez-nous pour votre chantier</H2>
          <div className="mt-8">
            <ContactChoices />
          </div>
        </Container>
      </section>
    </>
  );
}
