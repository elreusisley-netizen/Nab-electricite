import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { company } from "@/content/site";
import { PrintButton } from "@/components/quote/PrintButton";
import { QuoteDocument } from "@/components/quote/QuoteDocument";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQuoteDocument } from "@/lib/quote-document";
import { AcceptForm } from "./AcceptForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Votre devis",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.string().uuid().safeParse(token).success) notFound();
  const q = await loadQuoteDocument(createAdminClient(), { token });
  // Un brouillon n'est jamais visible par le client.
  if (!q || q.status === "brouillon") notFound();

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const expired = q.status === "expire" || (q.status === "envoye" && !!q.validUntil && q.validUntil < today);
  const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(q.ttcCents / 100);

  return (
    <div className="min-h-svh bg-fond py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[52rem] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <p className="text-sm text-texte">
          Une question ? <a href={company.phoneHref} className="font-semibold text-nuit underline">{company.phone}</a>
        </p>
        <PrintButton />
      </div>
      <QuoteDocument q={q} />
      <div className="mx-auto mt-6 max-w-[52rem] px-4 print:hidden">
        {q.status === "envoye" && !expired ? (
          <AcceptForm token={token} amount={amount} />
        ) : expired ? (
          <p className="rounded-xl border border-ligne bg-white p-5 text-texte">La validité de ce devis est dépassée. Appelez-nous au {company.phone} pour le mettre à jour.</p>
        ) : q.status === "refuse" ? (
          <p className="rounded-xl border border-ligne bg-white p-5 text-texte">Ce devis a été clôturé. Contactez-nous pour toute nouvelle demande.</p>
        ) : null}
      </div>
    </div>
  );
}
