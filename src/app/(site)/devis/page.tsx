import type { Metadata } from "next";
import { DevisForm } from "@/components/forms/DevisForm";
import type { RequestService } from "@/lib/labels";
import { Container, Eyebrow, PageHero } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Demande de devis",
  description: "Demandez un devis à Électricité N.A.B. pour vos travaux électriques à Bordeaux et en Nouvelle-Aquitaine.",
};

const steps = [
  "Vous êtes un particulier ou un professionnel",
  "Le type de bâtiment",
  "La prestation souhaitée",
  "L'adresse du chantier, la description et vos photos",
  "Vos coordonnées",
];

const fromSlug: Record<string, RequestService> = {
  "installation-electrique-neuve": "installation_neuve",
  "renovation-electrique": "renovation",
  "mise-aux-normes-nf-c-15-100": "mise_aux_normes",
  "tableau-electrique": "tableau_electrique",
  videosurveillance: "videosurveillance",
  interphonie: "interphonie",
  vmc: "vmc",
};

export default async function DevisPage({ searchParams }: { searchParams: Promise<{ prestation?: string }> }) {
  const { prestation } = await searchParams;
  const initialService = prestation ? fromSlug[prestation] : undefined;

  return (
    <>
      <PageHero
        eyebrow="Demande de devis"
        title="Décrivez votre projet"
        intro="Quelques informations suffisent pour préparer votre devis."
      />
      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow>Ce que nous vous demanderons</Eyebrow>
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-nuit font-semibold text-white">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <DevisForm initialService={initialService} />
        </Container>
      </section>
    </>
  );
}
