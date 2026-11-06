import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/site/ui";
import { company } from "@/content/site";

// Affiché tant que les formulaires en ligne ne sont pas branchés (phase 3).
export function FormComingSoon({ subject }: { subject: string }) {
  return (
    <div className="rounded-xl border border-ligne bg-white p-8">
      <p className="font-titre text-2xl font-bold text-nuit">Le formulaire en ligne arrive très bientôt</p>
      <p className="mt-3 text-texte">
        En attendant, contactez-nous directement pour votre {subject} : nous vous répondons rapidement.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={company.phoneHref}>
          <Icon name="phone" size={20} strokeWidth={2} />
          <span className="font-titre text-xl font-bold">{company.phone}</span>
        </ButtonLink>
        <ButtonLink href={`mailto:${company.email}`} variant="outline-dark">
          <Icon name="mail" size={20} strokeWidth={2} /> Écrire un e-mail
        </ButtonLink>
      </div>
    </div>
  );
}
