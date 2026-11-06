import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { company } from "@/content/site";

// Données d'un devis pour l'affichage (page admin imprimable et page client par lien).

export interface QuoteDocumentData {
  id: string;
  number: string | null;
  status: "brouillon" | "envoye" | "accepte" | "refuse" | "expire";
  title: string | null;
  issueDate: string | null;
  validUntil: string | null;
  conditions: string | null;
  globalDiscountPct: number;
  subtotalCents: number;
  htCents: number;
  tvaCents: number;
  ttcCents: number;
  acceptedAt: string | null;
  acceptedByName: string | null;
  client: {
    type: string;
    name: string;
    contact: string | null;
    siret: string | null;
    email: string | null;
    phone: string | null;
  };
  site: string | null;
  lines: {
    lineType: string;
    designation: string;
    quantity: number;
    unit: string;
    unitPriceCents: number;
    discountPct: number;
    taxRate: number | null;
    totalCents: number;
  }[];
  vat: { rate: number; baseCents: number; vatCents: number }[];
  issuer: {
    displayName: string;
    legalName: string;
    legalForm: string;
    siret: string;
    vatNumber: string;
    headOffice: string;
    phone: string;
    email: string;
    shareCapital: string | null;
    insurer: string | null;
    insurerCoverage: string | null;
    insurancePolicy: string | null;
    paymentTerms: string | null;
    mentions: string | null;
  };
}

const eurNoSymbol = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export async function loadQuoteDocument(
  sb: SupabaseClient,
  by: { id: string } | { token: string },
): Promise<QuoteDocumentData | null> {
  const query = sb
    .from("quotes")
    .select(
      "id, number, status, title, issue_date, valid_until, conditions, global_discount_pct, subtotal_ht_cents, total_ht_cents, total_tva_cents, total_ttc_cents, accepted_at, accepted_by_name, clients ( type, first_name, last_name, company_name, siret, email, phone ), sites ( address_line, postal_code, city )",
    );
  const { data, error } = "id" in by ? await query.eq("id", by.id).maybeSingle() : await query.eq("public_token", by.token).maybeSingle();
  if (error || !data) return null;
  const q = data as unknown as Record<string, unknown> & {
    clients: { type: string; first_name: string | null; last_name: string | null; company_name: string | null; siret: string | null; email: string | null; phone: string | null } | null;
    sites: { address_line: string; postal_code: string; city: string } | null;
  };

  const [{ data: lines }, { data: settings }] = await Promise.all([
    sb
      .from("quote_lines")
      .select("line_type, designation, quantity, unit, unit_price_cents, discount_pct, tax_rate, total_ht_cents")
      .eq("quote_id", q.id as string)
      .order("position"),
    sb.from("company_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const mapped = ((lines ?? []) as Record<string, unknown>[]).map((l) => ({
    lineType: l.line_type as string,
    designation: l.designation as string,
    quantity: Number(l.quantity),
    unit: l.unit as string,
    unitPriceCents: Number(l.unit_price_cents),
    discountPct: Number(l.discount_pct),
    taxRate: l.tax_rate === null ? null : Number(l.tax_rate),
    totalCents: Number(l.total_ht_cents),
  }));

  const disc = Number(q.global_discount_pct ?? 0);
  const byRate = new Map<number, number>();
  for (const l of mapped) {
    if (l.lineType === "texte" || l.taxRate === null) continue;
    byRate.set(l.taxRate, (byRate.get(l.taxRate) ?? 0) + l.totalCents);
  }
  const vat = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, base]) => {
      const baseAfter = Math.round(base * (1 - disc / 100));
      return { rate, baseCents: baseAfter, vatCents: Math.round((baseAfter * rate) / 100) };
    });

  const c = q.clients;
  const person = [c?.first_name, c?.last_name].filter(Boolean).join(" ");
  const s = (settings ?? {}) as Record<string, unknown>;
  const capital = s.share_capital_cents === null || s.share_capital_cents === undefined ? null : `${eurNoSymbol.format(Number(s.share_capital_cents) / 100)} €`;

  return {
    id: q.id as string,
    number: (q.number as string | null) ?? null,
    status: q.status as QuoteDocumentData["status"],
    title: (q.title as string | null) ?? null,
    issueDate: (q.issue_date as string | null) ?? null,
    validUntil: (q.valid_until as string | null) ?? null,
    conditions: (q.conditions as string | null) ?? null,
    globalDiscountPct: disc,
    subtotalCents: Number(q.subtotal_ht_cents),
    htCents: Number(q.total_ht_cents),
    tvaCents: Number(q.total_tva_cents),
    ttcCents: Number(q.total_ttc_cents),
    acceptedAt: (q.accepted_at as string | null) ?? null,
    acceptedByName: (q.accepted_by_name as string | null) ?? null,
    client: {
      type: c?.type ?? "particulier",
      name: c?.type === "professionnel" && c.company_name ? c.company_name : person || c?.company_name || "Client",
      contact: c?.type === "professionnel" && c.company_name && person ? person : null,
      siret: c?.siret ?? null,
      email: c?.email ?? null,
      phone: c?.phone ?? null,
    },
    site: q.sites ? `${q.sites.address_line}, ${q.sites.postal_code} ${q.sites.city}` : null,
    lines: mapped,
    vat,
    issuer: {
      displayName: company.displayName,
      legalName: company.legalName,
      legalForm: "EURL",
      siret: company.siret,
      vatNumber: company.vatNumber,
      headOffice: (s.head_office_address as string | null) || company.headOffice,
      phone: company.phone,
      email: company.email,
      shareCapital: capital,
      insurer: (s.insurer_name as string | null) ?? null,
      insurerCoverage: (s.insurer_coverage as string | null) ?? null,
      insurancePolicy: (s.insurance_policy_number as string | null) ?? null,
      paymentTerms: (s.payment_terms as string | null) ?? null,
      mentions: (s.quote_legal_mentions as string | null) ?? null,
    },
  };
}
