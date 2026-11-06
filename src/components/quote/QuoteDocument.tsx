import Image from "next/image";
import type { QuoteDocumentData } from "@/lib/quote-document";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const money = (cents: number) => eur.format(cents / 100);
const qty = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const day = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR") : null);
const todo = <span className="text-rouge-fonce">à compléter</span>;

/** Mise en page d'un devis, lisible à l'écran et à l'impression (Enregistrer en PDF). */
export function QuoteDocument({ q }: { q: QuoteDocumentData }) {
  const draft = q.status === "brouillon";
  return (
    <article className="relative mx-auto max-w-[52rem] bg-white p-6 text-[0.92rem] leading-relaxed text-encre shadow-sm print:max-w-none print:p-0 print:shadow-none md:p-12">
      {draft ? (
        <p className="mb-6 rounded-lg bg-rouge/10 px-4 py-2 text-center text-sm font-semibold text-rouge-fonce">
          BROUILLON — document non envoyé, sans valeur contractuelle
        </p>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-3">
          <Image src="/images/logo-ampoule.png" alt="" width={52} height={50} className="h-12 w-auto" />
          <div>
            <p className="font-titre text-2xl font-bold text-nuit">{q.issuer.displayName}</p>
            <p className="text-xs text-texte">
              {q.issuer.legalName} — {q.issuer.legalForm}
              {q.issuer.shareCapital ? ` au capital de ${q.issuer.shareCapital}` : ""}
              <br />
              {q.issuer.headOffice}
              <br />
              {q.issuer.phone} · {q.issuer.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-titre text-3xl font-bold text-nuit">Devis</p>
          <p className="font-semibold">{q.number ?? "Brouillon"}</p>
          <p className="text-xs text-texte">
            {q.issueDate ? <>Établi le {day(q.issueDate)}<br /></> : null}
            {q.validUntil ? <>Valable jusqu&apos;au {day(q.validUntil)}</> : null}
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-fond p-4">
          <p className="text-[0.7rem] font-semibold tracking-widest text-discret uppercase">Client</p>
          <p className="mt-1 font-semibold text-nuit">{q.client.name}</p>
          {q.client.contact ? <p>{q.client.contact}</p> : null}
          {q.client.siret ? <p className="text-xs">SIRET {q.client.siret}</p> : null}
          {q.client.phone ? <p className="text-xs">{q.client.phone}</p> : null}
          {q.client.email ? <p className="text-xs">{q.client.email}</p> : null}
        </div>
        <div className="rounded-lg bg-fond p-4">
          <p className="text-[0.7rem] font-semibold tracking-widest text-discret uppercase">Lieu d&apos;intervention</p>
          <p className="mt-1">{q.site ?? "—"}</p>
          {q.title ? (
            <>
              <p className="mt-3 text-[0.7rem] font-semibold tracking-widest text-discret uppercase">Objet</p>
              <p className="mt-1 font-semibold text-nuit">{q.title}</p>
            </>
          ) : null}
        </div>
      </section>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-nuit text-[0.7rem] tracking-wider text-discret uppercase">
              <th className="py-2 pr-3 font-semibold">Désignation</th>
              <th className="py-2 pr-3 text-right font-semibold">Qté</th>
              <th className="py-2 pr-3 text-right font-semibold">PU HT</th>
              <th className="py-2 pr-3 text-right font-semibold">TVA</th>
              <th className="py-2 text-right font-semibold">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {q.lines.map((l, i) =>
              l.lineType === "texte" ? (
                <tr key={i} className="border-b border-ligne">
                  <td colSpan={5} className="py-2 font-semibold whitespace-pre-line text-nuit">{l.designation}</td>
                </tr>
              ) : (
                <tr key={i} className="border-b border-ligne align-top">
                  <td className="py-2 pr-3 whitespace-pre-line">
                    {l.designation}
                    {l.discountPct > 0 ? <span className="block text-xs text-discret">Remise {qty(l.discountPct)} %</span> : null}
                  </td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap tabular-nums">{qty(l.quantity)} {l.unit}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap tabular-nums">{money(l.unitPriceCents)}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap tabular-nums">{l.taxRate !== null ? `${qty(l.taxRate)} %` : "—"}</td>
                  <td className="py-2 text-right whitespace-nowrap tabular-nums">{money(l.totalCents)}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <section className="mt-6 ml-auto w-full max-w-xs space-y-1 tabular-nums">
        {q.globalDiscountPct > 0 ? (
          <>
            <div className="flex justify-between"><span>Sous-total HT</span><span>{money(q.subtotalCents)}</span></div>
            <div className="flex justify-between"><span>Remise {qty(q.globalDiscountPct)} %</span><span>− {money(q.subtotalCents - q.htCents)}</span></div>
          </>
        ) : null}
        <div className="flex justify-between font-semibold"><span>Total HT</span><span>{money(q.htCents)}</span></div>
        {q.vat.map((v) => (
          <div key={v.rate} className="flex justify-between text-texte">
            <span>TVA {qty(v.rate)} %</span>
            <span>{money(v.vatCents)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t-2 border-nuit pt-2 font-titre text-2xl font-bold text-nuit">
          <span>Total TTC</span>
          <span>{money(q.ttcCents)}</span>
        </div>
      </section>

      {q.conditions || q.issuer.paymentTerms ? (
        <section className="mt-8 space-y-3">
          {q.conditions ? (
            <div>
              <p className="text-[0.7rem] font-semibold tracking-widest text-discret uppercase">Conditions particulières</p>
              <p className="mt-1 whitespace-pre-line">{q.conditions}</p>
            </div>
          ) : null}
          {q.issuer.paymentTerms ? (
            <div>
              <p className="text-[0.7rem] font-semibold tracking-widest text-discret uppercase">Conditions de paiement</p>
              <p className="mt-1 whitespace-pre-line">{q.issuer.paymentTerms}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {q.status === "accepte" ? (
        <section className="mt-8 rounded-lg border-2 border-nuit p-4">
          <p className="font-semibold text-nuit">Bon pour accord</p>
          <p className="text-sm">
            {q.acceptedByName ? `Accepté en ligne par ${q.acceptedByName}` : "Accepté"}
            {q.acceptedAt ? ` le ${new Date(q.acceptedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" })}` : ""}.
          </p>
        </section>
      ) : null}

      <footer className="mt-10 border-t border-ligne pt-4 text-[0.72rem] leading-snug text-discret">
        <p>
          {q.issuer.legalName}, {q.issuer.legalForm}
          {q.issuer.shareCapital ? ` au capital de ${q.issuer.shareCapital}` : ""} — SIRET {q.issuer.siret} — TVA intracommunautaire {q.issuer.vatNumber}
        </p>
        <p>
          Assurance décennale : {q.issuer.insurer ?? todo}
          {q.issuer.insurancePolicy ? `, contrat n° ${q.issuer.insurancePolicy}` : ""} — couverture : {q.issuer.insurerCoverage ?? todo}
        </p>
        <p>Prix exprimés en euros. Toute modification des travaux fera l&apos;objet d&apos;un nouveau devis.</p>
        {q.issuer.mentions ? <p className="mt-1 whitespace-pre-line">{q.issuer.mentions}</p> : null}
      </footer>
    </article>
  );
}
