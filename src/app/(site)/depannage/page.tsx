import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { FormComingSoon } from "@/components/site/FormComingSoon";
import { ButtonLink, Container, Eyebrow } from "@/components/site/ui";
import { getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Dépannage électrique 7j/7",
  description:
    "Panne électrique à Bordeaux ou en Nouvelle-Aquitaine ? Électricité N.A.B. intervient 7j/7, soir et week-end compris. Appelez le 06 66 61 43 73.",
};

export default function DepannagePage() {
  const company = getCompany();

  return (
    <>
      <section className="bg-nuit text-white">
        <Container className="py-14 sm:py-20">
          <Eyebrow light>Dépannage 7j/7</Eyebrow>
          <h1 className="max-w-3xl font-titre text-4xl font-bold leading-tight sm:text-5xl">Une panne électrique ?</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Nous intervenons 7 jours sur 7, y compris le soir et le week-end. Appelez-nous : nous vous indiquons tout de
            suite quand nous pouvons passer.
          </p>
          <div className="mt-8">
            <ButtonLink href={company.phoneHref}>
              <Icon name="phone" size={22} strokeWidth={2} />
              <span className="font-titre text-2xl font-bold">Appeler le {company.phone}</span>
            </ButtonLink>
          </div>
        </Container>
      </section>
      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow>En attendant notre passage</Eyebrow>
            <ul className="space-y-3 text-texte">
              <li className="flex gap-3"><Icon name="check" size={22} strokeWidth={2} className="mt-0.5 flex-none text-rouge" />Coupez le disjoncteur général si vous sentez une odeur de brûlé ou voyez des étincelles.</li>
              <li className="flex gap-3"><Icon name="check" size={22} strokeWidth={2} className="mt-0.5 flex-none text-rouge" />Ne touchez pas à un appareil ou à un câble endommagé.</li>
              <li className="flex gap-3"><Icon name="check" size={22} strokeWidth={2} className="mt-0.5 flex-none text-rouge" />Notez ce qui s'est passé juste avant la panne : cela aide à la trouver plus vite.</li>
              <li className="flex gap-3"><Icon name="check" size={22} strokeWidth={2} className="mt-0.5 flex-none text-rouge" />En cas de danger immédiat (incendie, personne électrisée), appelez le 18 ou le 112.</li>
            </ul>
          </div>
          <FormComingSoon subject="dépannage" />
        </Container>
      </section>
    </>
  );
}
