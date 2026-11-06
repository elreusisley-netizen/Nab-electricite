import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { ContactChoices, Container, DepannageBand, Eyebrow, H2, PageHero } from "@/components/site/ui";
import { getCompany, getReferences } from "@/lib/content";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Électricité N.A.B., entreprise d'électricité générale basée à Bordeaux : installation, rénovation, mise aux normes et dépannage 7j/7 en Nouvelle-Aquitaine.",
};

const engagements = [
  { icon: "shield" as const, title: "Des travaux aux normes", text: "Nos installations suivent la norme NF C 15-100, pour votre sécurité." },
  { icon: "doc" as const, title: "Un devis clair", text: "Chaque devis détaille les fournitures, la main-d'œuvre et les déplacements." },
  { icon: "clock" as const, title: "Joignables 7j/7", text: "Pour un dépannage, nous répondons aussi le soir et le week-end." },
  { icon: "home" as const, title: "Un chantier respecté", text: "Nous travaillons proprement et vous expliquons ce qui a été fait." },
];

export default function AboutPage() {
  const company = getCompany();
  const references = getReferences();

  return (
    <>
      <PageHero
        eyebrow="À propos"
        title="Une entreprise d'électricité générale à Bordeaux"
        intro={`${company.displayName} intervient chez les particuliers et les professionnels, dans toute la Nouvelle-Aquitaine.`}
      />

      <section>
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Notre métier</Eyebrow>
            <H2>De l'installation neuve au dépannage</H2>
            <p className="mt-5 text-texte">
              Nous réalisons des installations électriques neuves, des rénovations et des mises aux normes, ainsi que le
              remplacement de tableaux électriques. Nous installons aussi des systèmes de vidéosurveillance,
              d'interphonie et de VMC.
            </p>
            <p className="mt-4 text-texte">
              Nos clients sont des particuliers, des commerces, des bureaux et des entreprises. Pour les urgences, notre
              service de dépannage est joignable 7j/7, y compris le soir et le week-end.
            </p>
          </div>
          <div className="relative h-80 overflow-hidden rounded-xl">
            <Image
              src="/images/realisations/camionnette.jpg"
              alt="Camionnette d'intervention Électricité N.A.B."
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover object-[60%_50%]"
            />
          </div>
        </Container>
      </section>

      <section className="bg-fond">
        <Container className="py-20">
          <Eyebrow>Nos engagements</Eyebrow>
          <H2>Ce que vous pouvez attendre de nous</H2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {engagements.map((e) => (
              <li key={e.title} className="rounded-xl border border-ligne bg-white p-6">
                <Icon name={e.icon} size={30} strokeWidth={1.6} className="text-nuit" />
                <h3 className="mt-4 font-titre text-xl font-bold text-nuit">{e.title}</h3>
                <p className="mt-2 text-texte">{e.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section>
        <Container className="py-16 text-center">
          <h2 className="font-titre text-3xl font-bold text-nuit">Ils nous ont fait confiance</h2>
          <p className="mt-2 text-discret">Enseignes pour lesquelles nous avons réalisé des interventions.</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-16 gap-y-4 font-titre text-3xl font-semibold text-nuit">
            {references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Container>
      </section>

      <DepannageBand />

      <section className="bg-fond">
        <Container className="py-20">
          <H2>Un projet, une question ?</H2>
          <div className="mt-8">
            <ContactChoices />
          </div>
        </Container>
      </section>
    </>
  );
}
