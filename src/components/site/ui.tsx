import Link from "next/link";
import { Icon } from "@/components/icons";
import { company } from "@/content/site";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`mb-3 flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.25em] ${
        light ? "text-white/80" : "text-rouge-fonce"
      }`}
    >
      <span className="inline-block h-[3px] w-10 bg-rouge" />
      {children}
    </p>
  );
}

export function H2({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 className={`font-titre text-3xl font-bold leading-tight sm:text-4xl ${light ? "text-white" : "text-nuit"}`}>
      {children}
    </h2>
  );
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="bg-nuit text-white">
      <Container className="py-14 sm:py-20">
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1 className="max-w-3xl font-titre text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
        {intro ? <p className="mt-5 max-w-2xl text-lg text-white/85">{intro}</p> : null}
      </Container>
    </section>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline-light" | "outline-dark";
}) {
  const styles = {
    primary: "bg-rouge text-white hover:bg-rouge-fonce",
    "outline-light": "border-2 border-white text-white hover:bg-white hover:text-nuit",
    "outline-dark": "border-2 border-nuit text-nuit hover:bg-nuit hover:text-white",
  }[variant];
  const className = `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 font-semibold ${styles}`;
  return href.startsWith("tel:") || href.startsWith("mailto:") ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

// Bandeau dépannage réutilisé sur plusieurs pages. Aucun délai promis.
export function DepannageBand() {
  return (
    <section className="bg-nuit text-white">
      <Container className="flex flex-wrap items-center justify-between gap-8 py-14">
        <div className="flex max-w-2xl items-start gap-5">
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-rouge">
            <Icon name="bolt" size={30} />
          </span>
          <div>
            <h2 className="font-titre text-3xl font-bold">Une panne ? Dépannage 7j/7</h2>
            <p className="mt-2 text-white/85">
              Soir et week-end compris. Appelez-nous ou décrivez la panne en ligne : nous vous rappelons pour convenir
              d'un passage.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={company.phoneHref}>
            <Icon name="phone" size={20} strokeWidth={2} />
            <span className="font-titre text-xl font-bold">Appeler</span>
          </ButtonLink>
          <ButtonLink href="/depannage" variant="outline-light">
            Décrire la panne
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

export function ContactChoices() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Link
        href="/devis"
        className="flex flex-col gap-3 rounded-xl border border-ligne bg-white p-7 hover:border-nuit"
      >
        <Icon name="doc" size={34} strokeWidth={1.6} className="text-nuit" />
        <span className="font-titre text-2xl font-bold text-nuit">Demande de devis</span>
        <span className="text-texte">Décrivez votre projet en quelques étapes. Vous pourrez joindre des photos.</span>
        <span className="mt-auto inline-flex items-center gap-2 font-semibold text-rouge-fonce">
          Commencer <Icon name="arrow" size={18} strokeWidth={2} />
        </span>
      </Link>
      <Link
        href="/depannage"
        className="flex flex-col gap-3 rounded-xl border border-ligne bg-white p-7 hover:border-nuit"
      >
        <Icon name="bolt" size={34} strokeWidth={1.6} className="text-rouge" />
        <span className="font-titre text-2xl font-bold text-nuit">Demande de dépannage</span>
        <span className="text-texte">Décrivez la panne et son urgence. Pour une urgence, appelez directement.</span>
        <span className="mt-auto inline-flex items-center gap-2 font-semibold text-rouge-fonce">
          Signaler une panne <Icon name="arrow" size={18} strokeWidth={2} />
        </span>
      </Link>
    </div>
  );
}
