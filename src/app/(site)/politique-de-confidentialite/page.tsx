import type { Metadata } from "next";
import { Container, PageHero } from "@/components/site/ui";
import { getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

export default function PrivacyPage() {
  const c = getCompany();

  return (
    <>
      <PageHero eyebrow="Données personnelles" title="Politique de confidentialité" />
      <section>
        <Container className="max-w-3xl space-y-10 py-16 text-texte [&_h2]:font-titre [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-nuit [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
          <div>
            <h2>Responsable du traitement</h2>
            <p>
              {c.legalName} ({c.displayName}), {c.headOffice}. Contact : {c.email}.
            </p>
          </div>

          <div>
            <h2>Données collectées</h2>
            <p>Lorsque vous faites une demande de devis ou de dépannage, nous collectons :</p>
            <ul>
              <li>vos nom, prénom, téléphone et adresse e-mail ;</li>
              <li>l'adresse du chantier ou de l'intervention ;</li>
              <li>la description de votre besoin et les photos que vous choisissez d'envoyer.</li>
            </ul>
            <p>
              Les données de localisation contenues dans les photos (données EXIF) sont supprimées à la réception.
            </p>
          </div>

          <div>
            <h2>Finalités et base légale</h2>
            <p>
              Ces données servent uniquement à répondre à votre demande, à établir un devis, à organiser l'intervention et
              à assurer le suivi de nos prestations. Le traitement repose sur les mesures précontractuelles prises à votre
              demande, puis sur l'exécution du contrat, et sur nos obligations légales pour les documents comptables.
            </p>
          </div>

          <div>
            <h2>Durée de conservation</h2>
            <ul>
              <li>Demandes restées sans suite : 3 ans à compter de la demande.</li>
              <li>Clients : pendant la relation commerciale, puis 3 ans.</li>
              <li>Devis acceptés et factures : 10 ans, conformément aux obligations comptables.</li>
            </ul>
          </div>

          <div>
            <h2>Destinataires</h2>
            <p>
              Vos données sont destinées à {c.displayName} uniquement. Elles ne sont ni vendues ni cédées. Elles sont
              hébergées par nos prestataires techniques : Vercel (hébergement du site), Supabase (base de données, région
              Europe) et notre service d'envoi d'e-mails.
            </p>
          </div>

          <div>
            <h2>Cookies</h2>
            <p>
              Ce site n'utilise pas de cookies publicitaires ni de suivi. Seuls des cookies techniques, nécessaires au
              fonctionnement de l'espace d'administration, peuvent être déposés.
            </p>
          </div>

          <div>
            <h2>Vos droits</h2>
            <p>
              Vous pouvez accéder à vos données, les rectifier, les effacer, en limiter le traitement ou vous y opposer,
              en écrivant à {c.email}. Vous pouvez aussi introduire une réclamation auprès de la CNIL (cnil.fr).
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
