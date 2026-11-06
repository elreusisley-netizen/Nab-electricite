import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { ContactChoices, Container, Eyebrow, PageHero } from "@/components/site/ui";
import { getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez Électricité N.A.B. au 06 66 61 43 73 ou par e-mail. Électricien à Bordeaux, dépannage 7j/7.",
};

export default function ContactPage() {
  const company = getCompany();

  return (
    <>
      <PageHero eyebrow="Contact" title="Parlons de votre projet" intro="Par téléphone, par e-mail ou en ligne : choisissez ce qui vous convient." />
      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Coordonnées</Eyebrow>
            <ul className="space-y-5 text-lg">
              <li className="flex items-start gap-3">
                <Icon name="phone" size={24} strokeWidth={2} className="mt-1 text-rouge" />
                <span>
                  <a href={company.phoneHref} className="font-titre text-2xl font-bold text-nuit">{company.phone}</a>
                  <span className="block text-base text-discret">Dépannage 7j/7, soir et week-end</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="mail" size={24} strokeWidth={2} className="mt-1 text-rouge" />
                <a href={`mailto:${company.email}`} className="break-all text-nuit">{company.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="pin" size={24} strokeWidth={2} className="mt-1 text-rouge" />
                <span>
                  {company.city}
                  <span className="block text-base text-discret">Interventions dans toute la Nouvelle-Aquitaine</span>
                </span>
              </li>
            </ul>
          </div>
          <div>
            <Eyebrow>Faire une demande</Eyebrow>
            <ContactChoices />
          </div>
        </Container>
      </section>
    </>
  );
}
