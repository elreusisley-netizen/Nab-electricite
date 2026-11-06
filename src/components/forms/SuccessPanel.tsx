import Link from "next/link";
import { Icon } from "@/components/icons";
import { company } from "@/content/site";

export function SuccessPanel({
  kind,
  photosSent,
  photosFailed,
}: {
  kind: "devis" | "depannage";
  photosSent: number;
  photosFailed: number;
}) {
  return (
    <div role="status" className="rounded-xl border border-ligne bg-white p-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nuit text-white">
        <Icon name="check" size={30} strokeWidth={2.2} />
      </span>
      <h2 className="mt-5 font-titre text-3xl font-bold text-nuit">Demande envoyée</h2>
      <p className="mt-3 text-texte">
        Merci. Votre demande {kind === "devis" ? "de devis" : "de dépannage"} est bien enregistrée
        {photosSent > 0 ? ` avec ${photosSent} photo${photosSent > 1 ? "s" : ""}` : ""}. Nous revenons vers vous
        rapidement.
      </p>
      {photosFailed > 0 ? (
        <p className="mt-3 text-sm text-rouge-fonce">
          {photosFailed} photo{photosFailed > 1 ? "s n'ont" : " n'a"} pas pu être envoyée{photosFailed > 1 ? "s" : ""}. Vous
          pourrez nous la transmettre par e-mail à {company.email}.
        </p>
      ) : null}
      {kind === "depannage" ? (
        <p className="mt-3 font-semibold text-nuit">
          Pour une urgence, appelez directement le{" "}
          <a href={company.phoneHref} className="text-rouge-fonce underline">
            {company.phone}
          </a>
          .
        </p>
      ) : null}
      <Link href="/" className="mt-6 inline-flex font-semibold text-nuit underline-offset-4 hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  );
}
