import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ButtonLink, Container, DepannageBand, Eyebrow, H2 } from "@/components/site/ui";
import { getCompany, getRealisations, getService, getServices } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getServices().map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: `${service.title} à Bordeaux`,
    description: `${service.summary} Électricité N.A.B., Bordeaux et Nouvelle-Aquitaine.`,
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const company = getCompany();
  const photos = getRealisations().filter((r) => r.service === service.slug);
  const others = getServices().filter((s) => s.slug !== service.slug);
  const isDepannage = service.slug === "depannage-electrique";

  return (
    <>
      <section className="bg-nuit text-white">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <nav aria-label="Fil d'Ariane" className="mb-5 text-sm text-white/70">
              <Link href="/prestations" className="hover:text-white">Prestations</Link>
              <span aria-hidden="true"> / </span>
              <span>{service.shortTitle}</span>
            </nav>
            <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${isDepannage ? "bg-rouge" : "bg-white/10"}`}>
              <Icon name={service.icon} size={30} strokeWidth={1.7} />
            </span>
            <h1 className="mt-5 font-titre text-4xl font-bold leading-tight sm:text-5xl">{service.title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/85">{service.intro}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              {isDepannage ? (
                <>
                  <ButtonLink href={company.phoneHref}>
                    <Icon name="phone" size={20} strokeWidth={2} />
                    <span className="font-titre text-xl font-bold">{company.phone}</span>
                  </ButtonLink>
                  <ButtonLink href="/depannage" variant="outline-light">Décrire la panne</ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href={`/devis?prestation=${service.slug}`}>
                    Demander un devis <Icon name="arrow" size={18} strokeWidth={2} />
                  </ButtonLink>
                  <ButtonLink href={company.phoneHref} variant="outline-light">
                    <Icon name="phone" size={20} strokeWidth={2} /> {company.phone}
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
          {service.image ? (
            <div className="relative h-72 overflow-hidden rounded-xl sm:h-96">
              <Image src={service.image} alt="" fill priority sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" />
            </div>
          ) : null}
        </Container>
      </section>

      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Ce que comprend la prestation</Eyebrow>
            <ul className="mt-2 space-y-3">
              {service.includes.map((item) => (
                <li key={item} className="flex gap-3 text-lg">
                  <Icon name="check" size={22} strokeWidth={2} className="mt-1 flex-none text-rouge" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>Pour qui ?</Eyebrow>
            <p className="text-lg text-texte">{service.forWho}</p>
            {service.faq.length > 0 ? (
              <div className="mt-10">
                <Eyebrow>Questions fréquentes</Eyebrow>
                <dl className="space-y-6">
                  {service.faq.map((f) => (
                    <div key={f.q}>
                      <dt className="font-titre text-xl font-bold text-nuit">{f.q}</dt>
                      <dd className="mt-2 text-texte">{f.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      {photos.length > 0 ? (
        <section className="bg-fond">
          <Container className="py-16">
            <H2>Exemples de réalisations</H2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((r) => (
                <figure key={r.src}>
                  <div className="relative h-60 overflow-hidden rounded-xl">
                    <Image src={r.src} alt={r.alt} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  </div>
                  <figcaption className="mt-3 font-semibold text-nuit">{r.caption}</figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {isDepannage ? null : <DepannageBand />}

      <section>
        <Container className="py-16">
          <H2>Nos autres prestations</H2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/prestations/${s.slug}`}
                  className="flex h-full items-center gap-3 rounded-lg border border-ligne px-4 py-3 font-semibold text-nuit hover:border-nuit"
                >
                  <Icon name={s.icon} size={22} strokeWidth={1.7} className={s.icon === "bolt" ? "text-rouge" : ""} />
                  {s.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
