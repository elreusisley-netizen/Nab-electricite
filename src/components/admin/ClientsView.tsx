"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  displayClientName,
  QUOTE_STATUS,
  type ClientHistory,
  type ClientInput,
  type ClientRow,
  type CommercialStore,
} from "@/lib/admin/commercial";
import { formatEuros } from "@/lib/admin/quote-math";
import { INTERVENTION_STATUS } from "@/lib/admin/types";
import { allServices, clientTypes, formatDateTime, requestStatuses, type ClientType } from "@/lib/labels";
import { ErrorNote, Panel, Segmented, fieldClass, labelClass } from "./ui";

const emptyClient = (): ClientInput => ({
  type: "particulier",
  firstName: "",
  lastName: "",
  companyName: "",
  siret: "",
  email: "",
  phone: "",
  internalNotes: "",
});

const toInput = (c: ClientRow): ClientInput => ({
  id: c.id,
  type: c.type,
  firstName: c.firstName ?? "",
  lastName: c.lastName ?? "",
  companyName: c.companyName ?? "",
  siret: c.siret ?? "",
  email: c.email ?? "",
  phone: c.phone ?? "",
  internalNotes: c.internalNotes ?? "",
});

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Formulaire de fiche client (réutilisé pour la création rapide depuis un devis). */
export function ClientForm({ value, onChange }: { value: ClientInput; onChange: (v: ClientInput) => void }) {
  const set = <K extends keyof ClientInput>(k: K, v: ClientInput[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Type de client" className="flex gap-2">
        {(Object.entries(clientTypes) as [ClientType, string][]).map(([k, v]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={value.type === k}
            onClick={() => set("type", k)}
            className={`min-h-10 flex-1 rounded-full border text-sm ${value.type === k ? "border-nuit bg-nuit text-white" : "border-ligne text-nuit"}`}
          >
            {v}
          </button>
        ))}
      </div>
      {value.type === "professionnel" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cl-company" className={labelClass}>Entreprise *</label>
            <input id="cl-company" value={value.companyName} onChange={(e) => set("companyName", e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="cl-siret" className={labelClass}>SIRET</label>
            <input id="cl-siret" inputMode="numeric" value={value.siret} onChange={(e) => set("siret", e.target.value)} className={fieldClass} />
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cl-first" className={labelClass}>Prénom</label>
          <input id="cl-first" value={value.firstName} onChange={(e) => set("firstName", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="cl-last" className={labelClass}>Nom{value.type === "particulier" ? " *" : ""}</label>
          <input id="cl-last" value={value.lastName} onChange={(e) => set("lastName", e.target.value)} className={fieldClass} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cl-phone" className={labelClass}>Téléphone</label>
          <input id="cl-phone" type="tel" inputMode="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="cl-email" className={labelClass}>E-mail</label>
          <input id="cl-email" type="email" inputMode="email" value={value.email} onChange={(e) => set("email", e.target.value)} className={fieldClass} />
        </div>
      </div>
    </div>
  );
}

interface Props {
  store: CommercialStore;
  refreshKey: number;
  openClientId: string | null;
  onOpened: () => void;
  onNewQuote: (clientId: string) => void;
  onOpenQuote: (quoteId: string) => void;
  onToast: (m: string) => void;
}

export function ClientsView({ store, refreshKey, openClientId, onOpened, onNewQuote, onOpenQuote, onToast }: Props) {
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [filter, setFilter] = useState<"tous" | ClientType>("tous");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ClientInput | null>(null);
  const [history, setHistory] = useState<ClientHistory | null>(null);
  const [site, setSite] = useState({ addressLine: "", postalCode: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setClients(await store.listClients());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [store]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const open = useCallback(
    async (c: ClientRow) => {
      setEditing(toInput(c));
      setHistory(null);
      setError(null);
      setSite({ addressLine: "", postalCode: "", city: "" });
      try {
        setHistory(await store.clientHistory(c.id, c.email));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Historique indisponible.");
      }
    },
    [store],
  );

  useEffect(() => {
    if (!openClientId || !clients) return;
    const c = clients.find((x) => x.id === openClientId);
    if (c) open(c);
    onOpened();
  }, [openClientId, clients, open, onOpened]);

  const list = useMemo(() => {
    const term = normalize(q.trim());
    return (clients ?? []).filter((c) => {
      if (filter !== "tous" && c.type !== filter) return false;
      if (!term) return true;
      return normalize([displayClientName(c), c.phone, c.email, c.city].filter(Boolean).join(" ")).includes(term);
    });
  }, [clients, filter, q]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const id = await store.saveClient(editing);
      if (!editing.id && site.addressLine.trim()) await store.saveSite(id, site);
      onToast(editing.id ? "Fiche client enregistrée" : "Client ajouté");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function addSite() {
    if (!editing?.id) return;
    setBusy(true);
    setError(null);
    try {
      await store.saveSite(editing.id, site);
      setSite({ addressLine: "", postalCode: "", city: "" });
      setHistory(await store.clientHistory(editing.id, editing.email || null));
      onToast("Adresse ajoutée");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Adresse non enregistrée.");
    } finally {
      setBusy(false);
    }
  }

  const counts = {
    tous: clients?.length ?? 0,
    particulier: clients?.filter((c) => c.type === "particulier").length ?? 0,
    professionnel: clients?.filter((c) => c.type === "professionnel").length ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <label htmlFor="cl-search" className="sr-only">Rechercher un client</label>
          <input
            id="cl-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, téléphone, e-mail, ville…"
            className="min-h-11 w-full rounded-full border border-ligne bg-white px-4"
          />
        </div>
        <button type="button" onClick={() => { setEditing(emptyClient()); setHistory(null); setError(null); }} className="min-h-11 rounded-full bg-nuit px-5 text-sm text-white">
          + Nouveau client
        </button>
      </div>

      <Segmented
        label="Type de client"
        value={filter}
        onChange={setFilter}
        options={[
          { key: "tous", label: `Tous (${counts.tous})` },
          { key: "particulier", label: `Particuliers (${counts.particulier})` },
          { key: "professionnel", label: `Pros (${counts.professionnel})` },
        ]}
      />

      {clients === null ? (
        <p className="py-8 text-center text-discret">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-ligne bg-white p-8 text-center text-discret">
          {clients.length === 0 ? "Aucun client pour l'instant. Ils s'ajoutent quand vous planifiez une intervention ou créez un devis." : "Aucun client ne correspond."}
        </p>
      ) : (
        <ul className="divide-y divide-ligne rounded-xl border border-ligne bg-white">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => open(c)} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-semibold text-nuit">{displayClientName(c)}</span>
                <span className="block truncate text-sm text-discret">
                  {[clientTypes[c.type], c.city, c.phone].filter(Boolean).join(" · ")}
                </span>
              </button>
              {c.phone ? (
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} aria-label={`Appeler ${displayClientName(c)}`} className="grid size-11 shrink-0 place-items-center rounded-full border border-ligne text-nuit">
                  <Icon name="phone" size={18} strokeWidth={2} />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Panel
        open={editing !== null}
        title={editing?.id ? displayClientName({ type: editing.type, firstName: editing.firstName, lastName: editing.lastName, companyName: editing.companyName }) : "Nouveau client"}
        subtitle={editing?.id ? clientTypes[editing.type] : undefined}
        onClose={() => setEditing(null)}
        wide
        footer={
          <>
            {editing?.id ? (
              <button type="button" onClick={() => onNewQuote(editing.id as string)} className="min-h-11 rounded-full border border-nuit px-5 text-sm text-nuit">
                + Nouveau devis
              </button>
            ) : (
              <span />
            )}
            <button type="button" onClick={save} disabled={busy} className="min-h-12 rounded-full bg-nuit px-7 font-semibold text-white disabled:opacity-60">
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-6">
            <ErrorNote message={error} />
            <ClientForm value={editing} onChange={setEditing} />
            <div>
              <label htmlFor="cl-notes" className={labelClass}>Notes internes</label>
              <textarea
                id="cl-notes"
                rows={3}
                value={editing.internalNotes}
                onChange={(e) => setEditing({ ...editing, internalNotes: e.target.value })}
                placeholder="Code d'accès, interlocuteur, habitudes…"
                className={`${fieldClass} resize-y`}
              />
            </div>

            <section>
              <h3 className="font-titre text-xl font-bold text-nuit">Adresses de chantier</h3>
              {history?.sites.length ? (
                <ul className="mt-2 space-y-2">
                  {history.sites.map((s) => {
                    const a = `${s.addressLine}, ${s.postalCode} ${s.city}`;
                    return (
                      <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-fond px-3 py-2 text-sm">
                        <span>{a}</span>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`} target="_blank" rel="noopener noreferrer" className="shrink-0 underline">
                          Itinéraire
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : editing.id && history ? (
                <p className="mt-2 text-sm text-discret">Aucune adresse enregistrée.</p>
              ) : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_7rem_1fr]">
                <input aria-label="Adresse" placeholder="Adresse" value={site.addressLine} onChange={(e) => setSite({ ...site, addressLine: e.target.value })} className={fieldClass} />
                <input aria-label="Code postal" placeholder="CP" inputMode="numeric" value={site.postalCode} onChange={(e) => setSite({ ...site, postalCode: e.target.value })} className={fieldClass} />
                <input aria-label="Ville" placeholder="Ville" value={site.city} onChange={(e) => setSite({ ...site, city: e.target.value })} className={fieldClass} />
              </div>
              {editing.id ? (
                <button type="button" onClick={addSite} disabled={busy || !site.addressLine.trim()} className="mt-2 min-h-10 text-sm text-nuit underline underline-offset-4 disabled:opacity-40">
                  + Ajouter cette adresse
                </button>
              ) : (
                <p className="mt-1 text-xs text-discret">L&apos;adresse sera enregistrée avec la fiche.</p>
              )}
            </section>

            {editing.id ? (
              <section className="space-y-4">
                <h3 className="font-titre text-xl font-bold text-nuit">Historique</h3>
                {!history ? (
                  <p className="text-sm text-discret">Chargement…</p>
                ) : (
                  <>
                    <div>
                      <p className={labelClass}>Devis ({history.quotes.length})</p>
                      {history.quotes.length ? (
                        <ul className="mt-2 divide-y divide-ligne rounded-lg border border-ligne">
                          {history.quotes.map((qt) => (
                            <li key={qt.id}>
                              <button type="button" onClick={() => onOpenQuote(qt.id)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm">
                                <span className="min-w-0 truncate">
                                  {qt.number ?? "Brouillon"} · {qt.title ?? "Sans titre"}
                                </span>
                                <span className="shrink-0 text-discret">
                                  {formatEuros(qt.totalTtcCents)} · {QUOTE_STATUS[qt.status]}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-discret">Aucun devis.</p>
                      )}
                    </div>
                    <div>
                      <p className={labelClass}>Interventions ({history.interventions.length})</p>
                      {history.interventions.length ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {history.interventions.map((i) => (
                            <li key={i.id} className="flex justify-between gap-3 rounded-lg bg-fond px-3 py-2">
                              <span className="min-w-0 truncate">
                                {i.date ? `${formatDateTime(i.date)} · ` : ""}
                                {i.title} ({allServices[i.service]})
                              </span>
                              <span className="shrink-0 text-discret">{INTERVENTION_STATUS[i.status]}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-discret">Aucune intervention.</p>
                      )}
                    </div>
                    <div>
                      <p className={labelClass}>Demandes reçues ({history.requests.length})</p>
                      {history.requests.length ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {history.requests.map((r) => (
                            <li key={r.id} className="rounded-lg bg-fond px-3 py-2">
                              <span className="font-semibold">{r.kind === "devis" ? "Devis" : "Dépannage"}</span> · {formatDateTime(r.receivedAt)} · {requestStatuses[r.status]}
                              <span className="block truncate text-discret">{r.description}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-discret">Aucune demande.</p>
                      )}
                    </div>
                  </>
                )}
              </section>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
