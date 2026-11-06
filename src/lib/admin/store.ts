"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase/browser";
import type { RequestStatus } from "@/lib/labels";
import { hhmm, toISO, toTimestamp } from "./dates";
import type { AgendaItem, InterventionStatus, RequestItem, ServiceKey, SlotInput, StatIntervention } from "./types";

// Accès aux données de l'admin depuis le navigateur. La sécurité repose sur la RLS :
// seuls les comptes administrateurs (table profiles) peuvent lire et écrire.

const SLOT_SELECT = `id, kind, starts_at, ends_at, note,
  interventions ( id, title, service, status, description, internal_notes, request_id,
    clients ( id, type, first_name, last_name, company_name, phone, email ),
    sites ( id, address_line, postal_code, city ) )`;

type RawSlot = {
  id: string;
  kind: "intervention" | "blocage";
  starts_at: string;
  ends_at: string;
  note: string | null;
  interventions: {
    id: string;
    title: string;
    service: ServiceKey;
    status: InterventionStatus;
    description: string | null;
    internal_notes: string | null;
    request_id: string | null;
    clients: {
      id: string;
      type: "particulier" | "professionnel";
      first_name: string | null;
      last_name: string | null;
      company_name: string | null;
      phone: string | null;
      email: string | null;
    } | null;
    sites: { id: string; address_line: string; postal_code: string; city: string } | null;
  } | null;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function mapSlot(r: RawSlot): AgendaItem {
  const start = new Date(r.starts_at);
  const end = new Date(r.ends_at);
  const i = r.interventions;
  return {
    id: r.id,
    kind: r.kind,
    date: toISO(start),
    start: hhmm(start),
    end: hhmm(end),
    note: r.note,
    intervention:
      i && i.clients
        ? {
            id: i.id,
            title: i.title,
            service: i.service,
            status: i.status,
            description: i.description,
            internalNotes: i.internal_notes,
            requestId: i.request_id,
            client: {
              id: i.clients.id,
              type: i.clients.type,
              firstName: i.clients.first_name,
              lastName: i.clients.last_name,
              companyName: i.clients.company_name,
              phone: i.clients.phone,
              email: i.clients.email,
            },
            site: i.sites
              ? { id: i.sites.id, addressLine: i.sites.address_line, postalCode: i.sites.postal_code, city: i.sites.city }
              : null,
          }
        : null,
  };
}

const nullIfEmpty = (v: string) => (v.trim() === "" ? null : v.trim());

export function clientName(c: { type: string; firstName: string | null; lastName: string | null; companyName: string | null }) {
  if (c.type === "professionnel" && c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || c.companyName || "Client";
}

export function createAdminStore(sb: SupabaseClient = getBrowserClient()) {
  async function upsertClient(input: SlotInput): Promise<string> {
    const row = {
      type: input.clientType,
      first_name: nullIfEmpty(input.firstName),
      last_name: nullIfEmpty(input.lastName),
      company_name: nullIfEmpty(input.companyName),
      phone: nullIfEmpty(input.phone),
      phone_normalized: nullIfEmpty(input.phone.replace(/[^\d+]/g, "").replace(/^0/, "+33")),
      email: nullIfEmpty(input.email.toLowerCase()),
    };
    if (input.clientId) {
      const { error } = await sb.from("clients").update(row).eq("id", input.clientId);
      fail(error);
      return input.clientId;
    }
    // Évite les doublons : même e-mail ou même téléphone → même fiche client.
    if (row.email) {
      const { data } = await sb.from("clients").select("id").eq("email", row.email).maybeSingle();
      if (data?.id) {
        await sb.from("clients").update(row).eq("id", data.id);
        return data.id as string;
      }
    }
    if (row.phone_normalized) {
      const { data } = await sb.from("clients").select("id").eq("phone_normalized", row.phone_normalized).limit(1).maybeSingle();
      if (data?.id) {
        await sb.from("clients").update(row).eq("id", data.id);
        return data.id as string;
      }
    }
    const { data, error } = await sb.from("clients").insert(row).select("id").single();
    fail(error);
    return (data as { id: string }).id;
  }

  async function upsertSite(input: SlotInput, clientId: string): Promise<string | null> {
    if (!input.addressLine.trim()) return null;
    const row = {
      client_id: clientId,
      address_line: input.addressLine.trim(),
      postal_code: input.postalCode.trim(),
      city: input.city.trim(),
    };
    if (input.siteId) {
      const { error } = await sb.from("sites").update(row).eq("id", input.siteId);
      fail(error);
      return input.siteId;
    }
    const { data: existing } = await sb
      .from("sites")
      .select("id")
      .eq("client_id", clientId)
      .eq("address_line", row.address_line)
      .eq("postal_code", row.postal_code)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return existing.id as string;
    const { data, error } = await sb.from("sites").insert(row).select("id").single();
    fail(error);
    return (data as { id: string }).id;
  }

  return {
    async signOut() {
      await sb.auth.signOut();
    },

    async listAgenda(): Promise<AgendaItem[]> {
      const { data, error } = await sb.from("schedule_events").select(SLOT_SELECT).order("starts_at");
      fail(error);
      return ((data ?? []) as unknown as RawSlot[]).map(mapSlot);
    },

    async saveSlot(input: SlotInput) {
      const starts_at = toTimestamp(input.date, input.start);
      const ends_at = toTimestamp(input.date, input.end);
      if (new Date(ends_at) <= new Date(starts_at)) throw new Error("L'heure de fin doit être après l'heure de début.");

      if (input.kind === "blocage") {
        const row = { kind: "blocage", intervention_id: null, starts_at, ends_at, note: nullIfEmpty(input.note) };
        const q = input.slotId
          ? sb.from("schedule_events").update(row).eq("id", input.slotId)
          : sb.from("schedule_events").insert(row);
        const { error } = await q;
        fail(error);
        return;
      }

      if (!input.service) throw new Error("Choisissez le type de travaux.");
      if (input.clientType === "professionnel" && !input.companyName.trim())
        throw new Error("Indiquez le nom de l'entreprise.");
      if (input.clientType === "particulier" && !input.lastName.trim()) throw new Error("Indiquez le nom du client.");
      if (input.addressLine.trim() && !/^\d{5}$/.test(input.postalCode.trim()))
        throw new Error("Code postal à 5 chiffres.");
      if (input.addressLine.trim() && !input.city.trim()) throw new Error("Indiquez la ville.");

      const clientId = await upsertClient(input);
      const siteId = await upsertSite(input, clientId);

      const interventionRow = {
        client_id: clientId,
        site_id: siteId,
        request_id: input.requestId ?? null,
        service: input.service,
        title: input.title.trim() || "Intervention",
        description: nullIfEmpty(input.description),
        internal_notes: nullIfEmpty(input.internalNotes),
        status: input.status,
      };

      let interventionId = input.interventionId;
      if (interventionId) {
        const { error } = await sb.from("interventions").update(interventionRow).eq("id", interventionId);
        fail(error);
      } else {
        const { data, error } = await sb.from("interventions").insert(interventionRow).select("id").single();
        fail(error);
        interventionId = (data as { id: string }).id;
      }

      const slotRow = { kind: "intervention", intervention_id: interventionId, starts_at, ends_at };
      if (input.slotId) {
        const { error } = await sb.from("schedule_events").update(slotRow).eq("id", input.slotId);
        fail(error);
      } else {
        const { error } = await sb.from("schedule_events").insert(slotRow);
        fail(error);
        // Le créneau passe automatiquement l'intervention en « planifiée » : on rétablit le statut choisi.
        if (input.status !== "planifiee") await sb.from("interventions").update({ status: input.status }).eq("id", interventionId);
      }

      if (input.requestId) {
        await sb.from("requests").update({ status: "planifiee", client_id: clientId }).eq("id", input.requestId);
      }
    },

    async setInterventionStatus(interventionId: string, status: string) {
      const { error } = await sb.from("interventions").update({ status }).eq("id", interventionId);
      fail(error);
    },

    async deleteSlot(slotId: string) {
      const { error } = await sb.from("schedule_events").delete().eq("id", slotId);
      fail(error);
    },

    async listRequests(): Promise<RequestItem[]> {
      const { data, error } = await sb
        .from("requests")
        .select(
          "id, kind, status, client_type, first_name, last_name, email, phone, address_line, postal_code, city, building_type, service, failure_nature, urgency, description, received_at, client_id",
        )
        .order("received_at", { ascending: false })
        .limit(300);
      fail(error);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        kind: r.kind as RequestItem["kind"],
        status: r.status as RequestItem["status"],
        clientType: (r.client_type as RequestItem["clientType"]) ?? null,
        firstName: r.first_name as string,
        lastName: r.last_name as string,
        email: r.email as string,
        phone: r.phone as string,
        addressLine: r.address_line as string,
        postalCode: r.postal_code as string,
        city: r.city as string,
        buildingType: (r.building_type as RequestItem["buildingType"]) ?? null,
        service: (r.service as RequestItem["service"]) ?? null,
        failureNature: (r.failure_nature as string | null) ?? null,
        urgency: (r.urgency as RequestItem["urgency"]) ?? null,
        description: r.description as string,
        receivedAt: r.received_at as string,
        clientId: (r.client_id as string | null) ?? null,
      }));
    },

    async setRequestStatus(id: string, status: RequestStatus) {
      const { error } = await sb.from("requests").update({ status }).eq("id", id);
      fail(error);
    },

    async listInterventionsForStats(): Promise<StatIntervention[]> {
      const { data, error } = await sb
        .from("interventions")
        .select("service, status, created_at, completed_at, clients ( type )")
        .order("created_at", { ascending: false })
        .limit(2000);
      fail(error);
      return ((data ?? []) as unknown as {
        service: StatIntervention["service"];
        status: StatIntervention["status"];
        created_at: string;
        completed_at: string | null;
        clients: { type: StatIntervention["clientType"] } | null;
      }[]).map((r) => ({
        service: r.service,
        status: r.status,
        clientType: r.clients?.type ?? "particulier",
        createdAt: r.created_at,
        completedAt: r.completed_at,
      }));
    },
  };
}

export type AdminStore = ReturnType<typeof createAdminStore>;
