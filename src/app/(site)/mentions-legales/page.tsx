import type { Metadata } from "next";
import { Container, PageHero } from "@/components/site/ui";
import { getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: true, follow: true },
};

function Missing() {
  return <span className="rounded bg-rouge/10 px-1.5 text-rouge-fonce">[à compléter]</span>;
}

export default function LegalPage() {
  const c = getCompany();

  return (
    <>
      <PageHero eyebrow="Informations légales" title="Mentions légales" />
      <section>
        <Container className="max-w-3xl space-y-10 py-16 text-texte [&_h2]:font-titre [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-nuit">
          <div>
            <h2>Éditeur du site</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[220px_1fr]">
              <dt className="font-semibold text-encre">Dénomination</dt><dd>{c.legalName}</dd>
              <dt className="font-semibold text-encre">Nom commercial</dt><dd>{c.displayName}</dd>
              <dt className="font-semibold text-encre">Forme juridique</dt><dd>{c.legalForm}</dd>
              <dt className="font-semibold text-encre">Capital social</dt><dd>{c.shareCapital ?? <Missing />}</dd>
              <dt className="font-semibold text-encre">Siège social</dt><dd>{c.headOffice}</dd>
              <dt className="font-semibold text-encre">SIREN</dt><dd>{c.siren}</dd>
              <dt className="font-semibold text-encre">SIRET du siège</dt><dd>{c.siret}</dd>
              <dt className="font-semibold text-encre">N° TVA intracommunautaire</dt><dd>{c.vatNumber}</dd>
              <dt className="font-semibold text-encre">Activité (NAF)</dt><dd>{c.nafCode}</dd>
              <dt className="font-semibold text-encre">Téléphone</dt><dd>{c.phone}</dd>
              <dt className="font-semibold text-encre">E-mail</dt><dd>{c.email}</dd>
              <dt className="font-semibold text-encre">Directeur de la publication</dt><dd>{c.publicationDirector ?? <Missing />}</dd>
            </dl>
          </div>

          <div>
            <h2>Assurance professionnelle</h2>
            <p className="mt-4">
              Assurance responsabilité civile décennale : {c.insurer ?? <Missing />}
              {c.insuranceCoverage ? ` — couverture : ${c.insuranceCoverage}` : null}.
            </p>
          </div>

          <div>
            <h2>Hébergement</h2>
            <p className="mt-4">
              Site hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.
            </p>
            <p className="mt-2">Données hébergées par Supabase Inc. (région Europe) — supabase.com.</p>
          </div>

          <div>
            <h2>Propriété intellectuelle</h2>
            <p className="mt-4">
              Les textes et photographies de ce site sont la propriété de {c.legalName}, sauf mention contraire. Toute
              reproduction sans autorisation est interdite. Les noms d'enseignes cités dans la rubrique « Ils nous ont
              fait confiance » désignent des clients pour lesquels des interventions ont été réalisées ; leur mention ne
              constitue ni un partenariat ni une recommandation de leur part.
            </p>
          </div>

          <div>
            <h2>Données personnelles</h2>
            <p className="mt-4">
              Le traitement des données transmises via ce site est décrit dans la{" "}
              <a href="/politique-de-confidentialite" className="font-semibold text-nuit underline">politique de confidentialité</a>.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
