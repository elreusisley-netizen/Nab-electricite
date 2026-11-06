import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrintButton } from "@/components/quote/PrintButton";
import { QuoteDocument } from "@/components/quote/QuoteDocument";
import { requireAdmin } from "@/lib/auth";
import { loadQuoteDocument } from "@/lib/quote-document";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Devis", robots: { index: false, follow: false } };

export default async function AdminQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { supabase } = await requireAdmin();
  const q = await loadQuoteDocument(supabase, { id });
  if (!q) notFound();
  return (
    <div className="min-h-svh bg-fond py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[52rem] items-center justify-between gap-3 px-4 print:hidden">
        <Link href="/admin?vue=devis" className="min-h-11 content-center text-sm text-nuit underline underline-offset-4">← Retour aux devis</Link>
        <PrintButton />
      </div>
      <QuoteDocument q={q} />
    </div>
  );
}
