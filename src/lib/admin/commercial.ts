"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase/browser";
import type { ClientType, RequestStatus } from "@/lib/labels";
import type { InterventionStatus, ServiceKey } from "./types";

// Clients, devis et réglages : accès navigateur soumis à la RLS (administrateurs uniquement).

export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse" | "expire";
export type LineType = "prestation" | "fourniture" | "main_oeuvre" | "deplacement" | "texte";

export const QUOTE_STATUS: Record<QuoteStatus, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export const LINE_TYPES: Record<LineType, string> = {
  prestation: "Prestation",
  fourniture: "Fourniture",
  main_oeuvre: "Main-d'œuvre",
  deplacement: "Déplacement",
  texte: "Texte / titre",
};

export interface ClientRow {
  id: string;
  type: ClientType;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  siret: string | null;
  email: string | null;
  phone: string | null;
  internalNotes: string | null;
  createdAt: string;
  city: string | null;
}

export interface SiteRow {
  id: string;
  label: string | null;
  addressLine: string;
  postalCode: string;
  city: string;
}

export interface ClientHistory {
  sites: SiteRow[];
  requests: { id: string; kind: "devis" | "depannage"; status: RequestStatus; receivedAt: string; description: string }[];
  quotes: QuoteRow[];
  interventions: { id: string; title: string; service: ServiceKey; status: InterventionStatus; date: string | null }[];
}

export interface QuoteRow {
  id: string;
  number: string | null;
  status: QuoteStatus;
  title: string | null;
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  siteId: string | null;
  requestId: string | null;
  totalHtCents: number;
  totalTtcCents: number;
  issueDate: string | null;
  validUntil: string | null;
  createdAt: string;
  publicToken: string;
}

export interface QuoteLineInput {
  lineType: LineType;
  designation: string;
  quantity: string; // saisie libre (« 3,5 »)
  unit: string;
  unitPrice: string; // euros HT, saisie libre
  discountPct: string;
  taxRateId: string;
}

export interface QuoteDraft {
  id?: string;
  status: QuoteStatus;
  clientId: string;
  siteId: string;
  requestId: string | null;
  title: string;
  globalDiscountPct: string;
  notes: string;
  conditions: string;
  lines: QuoteLineInput[];
}

export interface TaxRate {
  id: string;
  label: string;
  rate: number;
  verifiedAt: string | null;
  notes: string | null;
}

export interface CatalogItem {
  id: string;
  lineType: LineType;
  designation: string;
  unit: string;
  unitPriceCents: number;
  defaultTaxRateId: string | null;
}

export interface CompanySettings {
  displayName: string;
  shareCapitalCents: number | null;
  headOfficeAddress: string | null;
  insurerName: string | null;
  insurerCoverage: string | null;
  insurancePolicyNumber: string | null;
  quoteValidityDays: number;
  paymentTerms: string | null;
  quoteLegalMentions: string | null;
}

export interface ClientInput {
  id?: string;
  type: ClientType;
  firstName: string;
  lastName: string;
  companyName: string;
  siret: string;
  email: string;
  phone: string;
  internalNotes: string;
}

const nn = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function displayClientName(c: { type: string; firstName: string | null; lastName: string | null; companyName: string | null }) {
  if (c.type === "professionnel" && c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || c.companyName || "Client";
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

type RawClient = {
  id: string;
  type: ClientType;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  siret: string | null;
  email: string | null;
  phone: string | null;
  internal_notes: string | null;
  created_at: string;
  sites?: { city: string }[] | null;
};

const mapClient = (r: RawClient): ClientRow => ({
  id: r.id,
  type: r.type,
  firstName: r.first_name,
  lastName: r.last_name,
  companyName: r.company_name,
  siret: r.siret,
  email: r.email,
  phone: r.phone,
  internalNotes: r.internal_notes,
  createdAt: r.created_at,
  city: r.sites?.[0]?.city ?? null,
});

type RawQuote = {
  id: string;
  number: string | null;
  status: QuoteStatus;
  title: string | null;
  client_id: string;
  site_id: string | null;
  request_id: string | null;
  total_ht_cents: number;
  total_ttc_cents: number;
  issue_date: string | null;
  valid_until: string | null;
  created_at: string;
  public_token: string;
  clients: { type: string; first_name: string | null; last_name: string | null; company_name: string | null; email: string | null; phone: string | null } | null;
};

const QUOTE_SELECT =
  "id, number, status, title, client_id, site_id, request_id, total_ht_cents, total_ttc_cents, issue_date, valid_until, created_at, public_token, clients ( type, first_name, last_name, company_name, email, phone )";

const mapQuote = (r: RawQuote): QuoteRow => ({
  id: r.id,
  number: r.number,
  status: r.status,
  title: r.title,
  clientId: r.client_id,
  clientName: r.clients
    ? displayClientName({ type: r.clients.type, firstName: r.clients.first_name, lastName: r.clients.last_name, companyName: r.clients.company_name })
    : "Client",
  clientEmail: r.clients?.email ?? null,
  clientPhone: r.clients?.phone ?? null,
  siteId: r.site_id,
  requestId: r.request_id,
  totalHtCents: Number(r.total_ht_cents),
  totalTtcCents: Number(r.total_ttc_cents),
  issueDate: r.issue_date,
  validUntil: r.valid_until,
  createdAt: r.created_at,
  publicToken: r.public_token,
});

export function createCommercialStore(sb: SupabaseClient = getBrowserClient()) {
  return {
    // ---------- Clients ----------
    async listClients(): Promise<ClientRow[]> {
      const { data, error } = await sb
        .from("clients")
        .select("id, type, first_name, last_name, company_name, siret, email, phone, internal_notes, created_at, sites ( city )")
        .order("created_at", { ascending: false })
        .limit(1000);
      fail(error);
      return ((data ?? []) as unknown as RawClient[]).map(mapClient);
    },

    async saveClient(input: ClientInput): Promise<string> {
      if (input.type === "professionnel" && !input.companyName.trim()) throw new Error("Indiquez le nom de l'entreprise.");
      if (input.type === "particulier" && !input.lastName.trim()) throw new Error("Indiquez le nom du client.");
      const row = {
        type: input.type,
        first_name: nn(input.firstName),
        last_name: nn(input.lastName),
        company_name: nn(input.companyName),
        siret: nn(input.siret),
        email: nn(input.email.toLowerCase()),
        phone: nn(input.phone),
        phone_normalized: nn(input.phone.replace(/[^\d+]/g, "").replace(/^0/, "+33")),
        internal_notes: nn(input.internalNotes),
      };
      if (input.id) {
        const { error } = await sb.from("clients").update(row).eq("id", input.id as string);
        if (error?.message.includes("clients_email_unique")) throw new Error("Un autre client utilise déjà cet e-mail.");
        fail(error);
        return input.id;
      }
      if (row.email) {
        const { data } = await sb.from("clients").select("id").eq("email", row.email).maybeSingle();
        if (data?.id) throw new Error("Un client avec cet e-mail existe déjà : utilisez la recherche.");
      }
      const { data, error } = await sb.from("clients").insert(row).select("id").single();
      fail(error);
      return (data as { id: string }).id;
    },

    async saveSite(clientId: string, site: { id?: string; addressLine: string; postalCode: string; city: string; label?: string }) {
      if (!/^\d{5}$/.test(site.postalCode.trim())) throw new Error("Code postal à 5 chiffres.");
      const row = { client_id: clientId, address_line: site.addressLine.trim(), postal_code: site.postalCode.trim(), city: site.city.trim(), label: site.label?.trim() || null };
      const { error } = site.id ? await sb.from("sites").update(row).eq("id", site.id) : await sb.from("sites").insert(row);
      fail(error);
    },

    async listSites(clientId: string): Promise<SiteRow[]> {
      const { data, error } = await sb.from("sites").select("id, label, address_line, postal_code, city").eq("client_id", clientId).order("created_at");
      fail(error);
      return ((data ?? []) as Record<string, string | null>[]).map((s) => ({
        id: s.id as string,
        label: s.label,
        addressLine: s.address_line as string,
        postalCode: s.postal_code as string,
        city: s.city as string,
      }));
    },

    async getQuote(id: string): Promise<QuoteRow> {
      const { data, error } = await sb.from("quotes").select(QUOTE_SELECT).eq("id", id).single();
      fail(error);
      return mapQuote(data as unknown as RawQuote);
    },

    async clientHistory(clientId: string, email: string | null): Promise<ClientHistory> {
      const [sites, reqById, reqByEmail, quotes, interventions] = await Promise.all([
        sb.from("sites").select("id, label, address_line, postal_code, city").eq("client_id", clientId).order("created_at"),
        sb.from("requests").select("id, kind, status, received_at, description").eq("client_id", clientId),
        email
          ? sb.from("requests").select("id, kind, status, received_at, description").eq("email", email)
          : Promise.resolve({ data: [], error: null }),
        sb.from("quotes").select(QUOTE_SELECT).eq("client_id", clientId).order("created_at", { ascending: false }),
        sb
          .from("interventions")
          .select("id, title, service, status, created_at, schedule_events ( starts_at )")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      ]);
      fail(sites.error);
      fail(quotes.error);
      fail(interventions.error);
      const reqs = new Map<string, Record<string, unknown>>();
      for (const r of [...((reqById.data ?? []) as Record<string, unknown>[]), ...((reqByEmail.data ?? []) as Record<string, unknown>[])]) {
        reqs.set(r.id as string, r);
      }
      return {
        sites: ((sites.data ?? []) as Record<string, string | null>[]).map((s) => ({
          id: s.id as string,
          label: s.label,
          addressLine: s.address_line as string,
          postalCode: s.postal_code as string,
          city: s.city as string,
        })),
        requests: [...reqs.values()]
          .map((r) => ({
            id: r.id as string,
            kind: r.kind as "devis" | "depannage",
            status: r.status as RequestStatus,
            receivedAt: r.received_at as string,
            description: r.description as string,
          }))
          .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
        quotes: ((quotes.data ?? []) as unknown as RawQuote[]).map(mapQuote),
        interventions: ((interventions.data ?? []) as unknown as {
          id: string;
          title: string;
          service: ServiceKey;
          status: InterventionStatus;
          schedule_events: { starts_at: string }[] | null;
        }[]).map((i) => ({
          id: i.id,
          title: i.title,
          service: i.service,
          status: i.status,
          date: i.schedule_events?.map((e) => e.starts_at).sort()[0] ?? null,
        })),
      };
    },

    // ---------- Devis ----------
    async listQuotes(): Promise<QuoteRow[]> {
      const { data, error } = await sb.from("quotes").select(QUOTE_SELECT).order("created_at", { ascending: false }).limit(500);
      fail(error);
      return ((data ?? []) as unknown as RawQuote[]).map(mapQuote);
    },

    async loadDraft(id: string): Promise<QuoteDraft> {
      const [q, lines] = await Promise.all([
        sb.from("quotes").select("id, status, client_id, site_id, request_id, title, global_discount_pct, notes, conditions").eq("id", id).single(),
        sb.from("quote_lines").select("position, line_type, designation, quantity, unit, unit_price_cents, discount_pct, tax_rate_id").eq("quote_id", id).order("position"),
      ]);
      fail(q.error);
      fail(lines.error);
      const r = q.data as Record<string, unknown>;
      return {
        id: r.id as string,
        status: r.status as QuoteStatus,
        clientId: r.client_id as string,
        siteId: (r.site_id as string | null) ?? "",
        requestId: (r.request_id as string | null) ?? null,
        title: (r.title as string | null) ?? "",
        globalDiscountPct: String(r.global_discount_pct ?? 0).replace(".", ","),
        notes: (r.notes as string | null) ?? "",
        conditions: (r.conditions as string | null) ?? "",
        lines: ((lines.data ?? []) as Record<string, unknown>[]).map((l) => ({
          lineType: l.line_type as LineType,
          designation: l.designation as string,
          quantity: String(l.quantity ?? 1).replace(".", ","),
          unit: (l.unit as string) ?? "u",
          unitPrice: (Number(l.unit_price_cents ?? 0) / 100).toFixed(2).replace(".", ","),
          discountPct: String(l.discount_pct ?? 0).replace(".", ","),
          taxRateId: (l.tax_rate_id as string | null) ?? "",
        })),
      };
    },

    async saveDraft(d: QuoteDraft): Promise<string> {
      if (!d.clientId) throw new Error("Choisissez un client.");
      if (d.lines.length === 0) throw new Error("Ajoutez au moins une ligne.");
      const row = {
        client_id: d.clientId,
        site_id: d.siteId || null,
        request_id: d.requestId,
        title: nn(d.title),
        notes: nn(d.notes),
        conditions: nn(d.conditions),
        global_discount_pct: Math.min(100, Math.max(0, num(d.globalDiscountPct))),
      };
      let id = d.id;
      if (id) {
        const { error } = await sb.from("quotes").update(row).eq("id", id);
        fail(error);
      } else {
        const { data, error } = await sb.from("quotes").insert(row).select("id").single();
        fail(error);
        id = (data as { id: string }).id;
        if (d.requestId) await sb.from("requests").update({ status: "devis_cree", client_id: d.clientId }).eq("id", d.requestId);
      }
      const lines = d.lines.map((l, i) => ({
        position: i + 1,
        line_type: l.lineType,
        designation: l.designation.trim() || LINE_TYPES[l.lineType],
        quantity: l.lineType === "texte" ? 0 : num(l.quantity),
        unit: l.unit.trim() || "u",
        unit_price_cents: l.lineType === "texte" ? 0 : Math.round(num(l.unitPrice) * 100),
        discount_pct: Math.min(100, Math.max(0, num(l.discountPct))),
        tax_rate_id: l.lineType === "texte" ? "" : l.taxRateId,
      }));
      const { error } = await sb.rpc("replace_quote_lines", { p_quote_id: id, p_lines: lines });
      fail(error);
      return id as string;
    },

    async setQuoteStatus(id: string, status: QuoteStatus) {
      const { error } = await sb.from("quotes").update({ status }).eq("id", id);
      fail(error);
    },

    async duplicateQuote(id: string): Promise<string> {
      const { data, error } = await sb.rpc("duplicate_quote", { p_quote_id: id });
      fail(error);
      return data as string;
    },

    async deleteDraft(id: string) {
      const { error } = await sb.from("quotes").delete().eq("id", id).eq("status", "brouillon");
      fail(error);
    },

    // ---------- Réglages ----------
    async listTaxRates(): Promise<TaxRate[]> {
      const { data, error } = await sb.from("tax_rates").select("id, label, rate, verified_at, notes").order("rate", { ascending: false });
      fail(error);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        label: r.label as string,
        rate: Number(r.rate),
        verifiedAt: (r.verified_at as string | null) ?? null,
        notes: (r.notes as string | null) ?? null,
      }));
    },

    async setTaxRateVerified(id: string, verified: boolean) {
      const { data: auth } = await sb.auth.getUser();
      const patch: Record<string, unknown> = verified
        ? { verified_at: new Date().toISOString(), verified_by: auth.user?.id ?? null }
        : { verified_at: null, verified_by: null };
      const { error } = await sb.from("tax_rates").update(patch).eq("id", id);
      fail(error);
    },

    async listCatalog(): Promise<CatalogItem[]> {
      const { data, error } = await sb
        .from("catalog_items")
        .select("id, line_type, designation, unit, unit_price_cents, default_tax_rate_id")
        .eq("active", true)
        .order("designation");
      fail(error);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        lineType: r.line_type as LineType,
        designation: r.designation as string,
        unit: r.unit as string,
        unitPriceCents: Number(r.unit_price_cents),
        defaultTaxRateId: (r.default_tax_rate_id as string | null) ?? null,
      }));
    },

    async saveCatalogItem(item: { id?: string; lineType: LineType; designation: string; unit: string; unitPrice: string; taxRateId: string }) {
      if (!item.designation.trim()) throw new Error("Indiquez une désignation.");
      const row = {
        line_type: item.lineType === "texte" ? "prestation" : item.lineType,
        designation: item.designation.trim(),
        unit: item.unit.trim() || "u",
        unit_price_cents: Math.max(0, Math.round(num(item.unitPrice) * 100)),
        default_tax_rate_id: item.taxRateId || null,
      };
      const { error } = item.id ? await sb.from("catalog_items").update(row).eq("id", item.id) : await sb.from("catalog_items").insert(row);
      fail(error);
    },

    async archiveCatalogItem(id: string) {
      const { error } = await sb.from("catalog_items").update({ active: false }).eq("id", id);
      fail(error);
    },

    async getSettings(): Promise<CompanySettings> {
      const { data, error } = await sb.from("company_settings").select("*").eq("id", 1).single();
      fail(error);
      const r = data as Record<string, unknown>;
      return {
        displayName: r.display_name as string,
        shareCapitalCents: (r.share_capital_cents as number | null) ?? null,
        headOfficeAddress: (r.head_office_address as string | null) ?? null,
        insurerName: (r.insurer_name as string | null) ?? null,
        insurerCoverage: (r.insurer_coverage as string | null) ?? null,
        insurancePolicyNumber: (r.insurance_policy_number as string | null) ?? null,
        quoteValidityDays: Number(r.quote_validity_days ?? 30),
        paymentTerms: (r.payment_terms as string | null) ?? null,
        quoteLegalMentions: (r.quote_legal_mentions as string | null) ?? null,
      };
    },

    async saveSettings(s: CompanySettings) {
      const { error } = await sb
        .from("company_settings")
        .update({
          share_capital_cents: s.shareCapitalCents,
          head_office_address: s.headOfficeAddress,
          insurer_name: s.insurerName,
          insurer_coverage: s.insurerCoverage,
          insurance_policy_number: s.insurancePolicyNumber,
          quote_validity_days: Math.min(365, Math.max(1, Math.round(s.quoteValidityDays))),
          payment_terms: s.paymentTerms,
          quote_legal_mentions: s.quoteLegalMentions,
        })
        .eq("id", 1);
      fail(error);
    },
  };
}

export type CommercialStore = ReturnType<typeof createCommercialStore>;
