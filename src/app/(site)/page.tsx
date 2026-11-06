import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { RealisationMedia } from "@/components/site/RealisationMedia";
import { ButtonLink, ContactChoices, Container, DepannageBand, Eyebrow, H2 } from "@/components/site/ui";
import { getCompany, getDepartments, getRealisations, getReferences, getServices } from "@/lib/content";

export default function HomePage() {
  const company = getCompany();
  const services = getServices();
  const realisations = getRealisations().slice(0, 4);
  const references = getReferences();
  const departments = getDepartments();

  return (
    <>
      {/* 1. Bannière */}
      <section className="bg-nuit text-white">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-[13px] uppercase tracking-[0.3em] text-white/75">Électricité générale · Bordeaux</p>
            <h1 className="font-titre text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-[56px]">
              Installation, rénovation et dépannage électrique
            </h1>
            <div className="my-6 h-1 w-16 rounded bg-rouge" />
            <p className="max-w-xl text-lg text-white/85">
              {company.displayName} accompagne particuliers et professionnels dans leurs travaux électriques, partout en
              Nouvelle-Aquitaine.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink href="/devis">
                Demander un devis <Icon name="arrow" size={18} strokeWidth={2} />
              </ButtonLink>
              <ButtonLink href={company.phoneHref} variant="outline-light">
                <Icon name="phone" size={20} strokeWidth={2} />
                <span className="font-titre text-xl font-bold">{company.phone}</span>
              </ButtonLink>
            </div>
            <ul className="mt-10 grid max-w-xl grid-cols-2 gap-4 text-[15px] text-white/85">
              <li className="flex items-center gap-3"><Icon name="bolt" size={22} />Dépannage 7j/7</li>
              <li className="flex items-center gap-3"><Icon name="clock" size={22} />Soir et week-end</li>
              <li className="flex items-center gap-3"><Icon name="pin" size={22} />Toute la Nouvelle-Aquitaine</li>
              <li className="flex items-center gap-3"><Icon name="shield" size={22} />Mise aux normes NF C 15-100</li>
            </ul>
          </div>
          <div className="relative h-72 overflow-hidden rounded-xl sm:h-96 lg:h-[460px]">
            <Image
              src="/images/realisations/showroom-cuisine.jpg"
              alt="Éclairage d'un showroom de cuisines réalisé par Électricité N.A.B."
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>

      {/* 3. Bandeau des prestations */}
      <section aria-label="Nos prestations" className="border-b border-ligne bg-fond">
        <Container>
          <ul className="grid grid-cols-2 gap-2 py-6 sm:grid-cols-4 lg:grid-cols-8">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/prestations/${s.slug}`}
                  className={`flex h-full flex-col items-center gap-2 rounded-lg px-2 py-3 text-center text-[15px] font-semibold hover:bg-white ${
                    s.icon === "bolt" ? "text-rouge-fonce" : "text-nuit"
                  }`}
                >
                  <Icon name={s.icon} size={32} strokeWidth={1.6} className={s.icon === "bolt" ? "text-rouge" : ""} />
                  {s.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 2. Présentation */}
      <section>
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>L'entreprise</Eyebrow>
            <H2>Un électricien de Bordeaux, pour toute la Nouvelle-Aquitaine</H2>
            <p className="mt-5 text-texte">
              {company.displayName} réalise des installations neuves, des rénovations et des mises aux normes NF C 15-100,
              chez les particuliers comme dans les commerces et les bureaux.
            </p>
            <p className="mt-4 text-texte">
              Tableaux électriques, vidéosurveillance, interphonie, VMC : un seul interlocuteur pour vos travaux, et un
              service de dépannage joignable 7j/7, y compris le soir et le week-end.
            </p>
            <Link href="/a-propos" className="mt-6 inline-flex items-center gap-2 font-semibold text-nuit hover:text-rouge-fonce">
              En savoir plus sur l'entreprise <Icon name="arrow" size={18} strokeWidth={2} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative col-span-2 h-60 overflow-hidden rounded-xl">
              <Image src="/images/realisations/camionnette.jpg" alt="Camionnette d'intervention Électricité N.A.B." fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover object-[60%_50%]" />
            </div>
            <div className="relative h-44 overflow-hidden rounded-xl">
              <Image src="/images/realisations/charpente-chantier.jpg" alt="Câblage d'une construction à ossature bois en cours de chantier" fill sizes="(min-width: 1024px) 270px, 50vw" className="object-cover object-[50%_30%]" />
            </div>
            <div className="relative h-44 overflow-hidden rounded-xl">
              <Image src="/images/realisations/coffret-compteurs.jpg" alt="Coffrets de comptage installés et repérés" fill sizes="(min-width: 1024px) 270px, 50vw" className="object-cover" />
            </div>
          </div>
        </Container>
      </section>

      {/* 4–5. Particuliers et professionnels */}
      <section className="bg-fond">
        <Container className="py-20">
          <Eyebrow>Nos services</Eyebrow>
          <H2>Des solutions adaptées à chaque besoin</H2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-xl border border-ligne bg-white">
              <div className="relative h-56">
                <Image src="/images/realisations/maison-neuve.jpg" alt="Maison neuve dont l'installation électrique a été réalisée par Électricité N.A.B." fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
              <div className="p-8">
                <h3 className="font-titre text-3xl font-bold text-nuit">Particuliers</h3>
                <p className="mt-2 text-texte">Maisons et appartements : du remplacement d'un tableau à la rénovation complète.</p>
                <ul className="mt-5 space-y-2">
                  {["Installation électrique neuve", "Rénovation et mise aux normes NF C 15-100", "Remplacement de tableau électrique", "Interphonie, VMC, vidéosurveillance"].map((t) => (
                    <li key={t} className="flex gap-2"><Icon name="check" size={20} strokeWidth={2} className="mt-0.5 flex-none text-rouge" />{t}</li>
                  ))}
                </ul>
                <Link href="/devis" className="mt-6 inline-flex items-center gap-2 font-semibold text-rouge-fonce">
                  Demander un devis <Icon name="arrow" size={18} strokeWidth={2} />
                </Link>
              </div>
            </article>
            <article className="overflow-hidden rounded-xl bg-nuit text-white">
              <div className="relative h-56">
                <Image src="/images/realisations/restaurant-neons.jpg" alt="Éclairage néon d'un restaurant" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
              <div className="p-8">
                <h3 className="font-titre text-3xl font-bold">Professionnels</h3>
                <p className="mt-2 text-white/85">Commerces, bureaux et entreprises : des travaux organisés autour de votre activité.</p>
                <ul className="mt-5 space-y-2">
                  {["Installation et rénovation de commerces et bureaux", "Mise aux normes", "Éclairage, vidéosurveillance et interphonie", "Dépannage, y compris en dehors des heures d'ouverture"].map((t) => (
                    <li key={t} className="flex gap-2"><Icon name="check" size={20} strokeWidth={2} className="mt-0.5 flex-none text-rouge" />{t}</li>
                  ))}
                </ul>
                <Link href="/devis" className="mt-6 inline-flex items-center gap-2 font-semibold text-white underline-offset-4 hover:underline">
                  Demander un devis <Icon name="arrow" size={18} strokeWidth={2} />
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </section>

      {/* 6. Références */}
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

      {/* 7. Réalisations */}
      <section className="bg-fond">
        <Container className="py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Réalisations</Eyebrow>
              <H2>Nos derniers chantiers</H2>
            </div>
            <Link href="/realisations" className="inline-flex items-center gap-2 font-semibold text-nuit hover:text-rouge-fonce">
              Voir toutes les réalisations <Icon name="arrow" size={18} strokeWidth={2} />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {realisations.map((r) => (
              <figure key={r.src}>
                <RealisationMedia r={r} heightClass="h-60" sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw" />
                <figcaption className="mt-3 font-semibold text-nuit">{r.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* 8. Dépannage */}
      <DepannageBand />

      {/* 9. Zone d'intervention */}
      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Eyebrow>Zone d'intervention</Eyebrow>
            <H2>Basés à Bordeaux, nous intervenons dans toute la Nouvelle-Aquitaine</H2>
            <p className="mt-5 text-texte">
              Hors de Gironde ? Indiquez l'adresse du chantier dans votre demande, nous vous répondons sur la faisabilité.
            </p>
            <Link href="/zone-intervention" className="mt-6 inline-flex items-center gap-2 font-semibold text-nuit hover:text-rouge-fonce">
              Voir la zone d'intervention <Icon name="arrow" size={18} strokeWidth={2} />
            </Link>
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

      {/* 10. Avis clients : affichés seulement quand de vrais avis existent (phase 7). */}

      {/* 11. Contact */}
      <section className="bg-fond">
        <Container className="grid gap-10 py-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Contact</Eyebrow>
            <H2>Parlons de votre projet</H2>
            <ul className="mt-6 space-y-4 text-lg">
              <li className="flex items-center gap-3">
                <Icon name="phone" size={22} strokeWidth={2} className="text-rouge" />
                <a href={company.phoneHref} className="font-semibold text-nuit">{company.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="mail" size={22} strokeWidth={2} className="text-rouge" />
                <a href={`mailto:${company.email}`} className="break-all text-nuit">{company.email}</a>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="pin" size={22} strokeWidth={2} className="text-rouge" />
                {company.city} · toute la Nouvelle-Aquitaine
              </li>
            </ul>
          </div>
          <ContactChoices />
        </Container>
      </section>
    </>
  );
}
