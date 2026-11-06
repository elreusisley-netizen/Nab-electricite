import Link from "next/link";
import { company, services } from "@/content/site";

export function Footer() {
  return (
    <footer className="bg-nuit-fonce pb-24 text-sm text-white/75 lg:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="font-titre text-xl font-bold text-white">ÉLECTRICITÉ N.A.B.</p>
          <p className="mt-3">Électricité générale à Bordeaux et dans toute la Nouvelle-Aquitaine, pour les particuliers et les professionnels.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Prestations</p>
          <ul className="mt-3 space-y-2">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/prestations/${s.slug}`} className="hover:text-white">
                  {s.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Entreprise</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/a-propos" className="hover:text-white">À propos</Link></li>
            <li><Link href="/realisations" className="hover:text-white">Réalisations</Link></li>
            <li><Link href="/zone-intervention" className="hover:text-white">Zone d'intervention</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Contact</p>
          <ul className="mt-3 space-y-2">
            <li><a href={company.phoneHref} className="font-semibold text-white hover:underline">{company.phone}</a></li>
            <li><a href={`mailto:${company.email}`} className="hover:text-white">{company.email}</a></li>
            <li>{company.city} · {company.serviceArea}</li>
            <li>Dépannage 7j/7, soir et week-end</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-4 py-5 sm:px-6">
          <span>© {new Date().getFullYear()} EURL {company.legalName}</span>
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
            <Link href="/politique-de-confidentialite" className="hover:text-white">Politique de confidentialité</Link>
            <a href="/admin" className="hover:text-white">Espace admin</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
