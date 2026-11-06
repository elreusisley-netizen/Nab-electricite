"use client";

import { useEffect, useMemo, useState } from "react";
import { sendQuote } from "@/app/admin/devis-actions";
import {
  displayClientName,
  LINE_TYPES,
  QUOTE_STATUS,
  type CatalogItem,
  type ClientInput,
  type ClientRow,
  type CommercialStore,
  type LineType,
  type QuoteDraft,
  type QuoteLineInput,
  type QuoteRow,
  type SiteRow,
  type TaxRate,
} from "@/lib/admin/commercial";
import { centsToInput, formatEuros, parseDecimal, parseEurosToCents, quoteTotals } from "@/lib/admin/quote-math";
import { ClientForm } from "./ClientsView";
import { ErrorNote, Panel, fieldClass, labelClass } from "./ui";

export type QuoteEditorTarget =
  | { mode: "new"; clientId?: string; requestId?: string | null; title?: string; notes?: string }
  | { mode: "open"; id: string };

interface Props {
  store: CommercialStore;
  target: QuoteEditorTarget | null;
  onClose: () => void;
  onChanged: () => void;
  onToast: (m: string) => void;
  onSchedule: (q: QuoteRow) => void;
}

const UNITS = ["u", "h", "m", "m²", "forfait", "lot", "jour"];

const emptyLine = (taxRateId: string, lineType: LineType = "prestation"): QuoteLineInput => ({
  lineType,
  designation: "",
  quantity: "1",
  unit: lineType === "main_oeuvre" ? "h" : lineType === "deplacement" ? "forfait" : "u",
  unitPrice: "",
  discountPct: "0",
  taxRateId,
});

const newDraft = (t: Extract<QuoteEditorTarget, { mode: "new" }>, taxRateId: string): QuoteDraft => ({
  status: "brouillon",
  clientId: t.clientId ?? "",
  siteId: "",
  requestId: t.requestId ?? null,
  title: t.title ?? "",
  globalDiscountPct: "0",
  notes: t.notes ?? "",
  conditions: "",
  lines: [emptyLine(taxRateId)],
});

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

export function QuoteEditor({ store, target, onClose, onChanged, onToast, onSchedule }: Props) {
  const [draft, setDraft] = useState<QuoteDraft | null>(null);
  const [row, setRow] = useState<QuoteRow | null>(null);
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [newClient, setNewClient] = useState<ClientInput | null>(null);
  const [newSite, setNewSite] = useState({ addressLine: "", postalCode: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  const verified = rates.filter((r) => r.verifiedAt);
  const editable = draft?.status === "brouillon";

  // Chargement à l'ouverture
  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setError(null);
    setLink(null);
    setDraft(null);
    setRow(null);
    setNewClient(null);
    setShowCatalog(false);
    (async () => {
      try {
        const [r, c, cl] = await Promise.all([store.listTaxRates(), store.listCatalog(), store.listClients()]);
        if (cancelled) return;
        setRates(r);
        setCatalog(c);
        setClients(cl);
        const defaultRate = r.find((x) => x.verifiedAt)?.id ?? "";
        if (target.mode === "new") {
          setDraft(newDraft(target, defaultRate));
        } else {
          const [d, q] = await Promise.all([store.loadDraft(target.id), store.getQuote(target.id)]);
          if (cancelled) return;
          setDraft(d);
          setRow(q);
          if (q.status !== "brouillon") setLink(`${window.location.origin}/devis/${q.publicToken}`);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Chargement impossible.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target, store]);

  // Adresses du client choisi
  useEffect(() => {
    if (!draft?.clientId) {
      setSites([]);
      return;
    }
    store
      .listSites(draft.clientId)
      .then(setSites)
      .catch(() => setSites([]));
  }, [draft?.clientId, store]);

  const totals = useMemo(() => {
    if (!draft) return null;
    const rateById = new Map(rates.map((r) => [r.id, r.rate]));
    return quoteTotals(
      draft.lines.map((l) => ({
        lineType: l.lineType,
        quantity: parseDecimal(l.quantity),
        unitPriceCents: parseEurosToCents(l.unitPrice),
        discountPct: parseDecimal(l.discountPct),
        taxRate: rateById.get(l.taxRateId) ?? null,
      })),
      parseDecimal(draft.globalDiscountPct),
    );
  }, [draft, rates]);

  const filteredClients = useMemo(() => {
    const t = clientSearch.trim().toLowerCase();
    const list = t
      ? clients.filter((c) => [displayClientName(c), c.phone, c.email, c.city].filter(Boolean).join(" ").toLowerCase().includes(t))
      : clients;
    return list.slice(0, 8);
  }, [clients, clientSearch]);

  if (!target) return null;

  const set = (patch: Partial<QuoteDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setLine = (i: number, patch: Partial<QuoteLineInput>) =>
    setDraft((d) => (d ? { ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) } : d));
  const moveLine = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      const j = i + dir;
      if (j < 0 || j >= d.lines.length) return d;
      const lines = [...d.lines];
      [lines[i], lines[j]] = [lines[j], lines[i]];
      return { ...d, lines };
    });
  const defaultRate = verified[0]?.id ?? "";
  const selectedClient = clients.find((c) => c.id === draft?.clientId) ?? null;

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opération impossible.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function persist(): Promise<string> {
    if (!draft) throw new Error("Devis non chargé.");
    let siteId = draft.siteId;
    if (!siteId && newSite.addressLine.trim()) {
      await store.saveSite(draft.clientId, newSite);
      const fresh = await store.listSites(draft.clientId);
      siteId = fresh.find((s) => s.addressLine === newSite.addressLine.trim())?.id ?? "";
      setSites(fresh);
      setNewSite({ addressLine: "", postalCode: "", city: "" });
    }
    const id = await store.saveDraft({ ...draft, siteId });
    setDraft({ ...draft, id, siteId });
    return id;
  }

  const save = () =>
    run(async () => {
      await persist();
      onToast("Brouillon enregistré");
      onChanged();
    });

  const send = () =>
    run(async () => {
      if (!window.confirm("Envoyer ce devis ? Il recevra un numéro et ne sera plus modifiable.")) return;
      const id = await persist();
      const res = await sendQuote(id);
      if (!res.ok) throw new Error(res.error);
      setLink(res.link);
      const [d, q] = await Promise.all([store.loadDraft(id), store.getQuote(id)]);
      setDraft(d);
      setRow(q);
      onToast(res.emailed ? `Devis ${res.number} envoyé par e-mail` : `Devis ${res.number} prêt à transmettre`);
      if (res.emailNote) setError(res.emailNote);
      onChanged();
    });

  const resend = () =>
    run(async () => {
      if (!draft?.id) return;
      const res = await sendQuote(draft.id);
      if (!res.ok) throw new Error(res.error);
      onToast(res.emailed ? "Lien renvoyé par e-mail" : "Lien prêt à copier");
      if (res.emailNote) setError(res.emailNote);
    });

  const setStatus = (status: "accepte" | "refuse") =>
    run(async () => {
      if (!draft?.id) return;
      await store.setQuoteStatus(draft.id, status);
      const q = await store.getQuote(draft.id);
      setRow(q);
      setDraft({ ...draft, status });
      onToast(status === "accepte" ? "Devis accepté" : "Devis refusé");
      onChanged();
    });

  const duplicate = () =>
    run(async () => {
      if (!draft?.id) return;
      const id = await store.duplicateQuote(draft.id);
      const d = await store.loadDraft(id);
      setDraft(d);
      setRow(null);
      setLink(null);
      onToast("Copie créée en brouillon : modifiez-la puis envoyez-la");
      onChanged();
    });

  const remove = () =>
    run(async () => {
      if (!draft?.id) {
        onClose();
        return;
      }
      if (!window.confirm("Supprimer ce brouillon ?")) return;
      await store.deleteDraft(draft.id);
      onToast("Brouillon supprimé");
      onChanged();
      onClose();
    });

  const createClient = () =>
    run(async () => {
      if (!newClient) return;
      const id = await store.saveClient(newClient);
      setClients(await store.listClients());
      set({ clientId: id, siteId: "" });
      setNewClient(null);
      setClientSearch("");
    });

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      onToast("Lien copié");
    } catch {
      window.prompt("Copiez le lien :", link);
    }
  };

  const insertCatalog = (item: CatalogItem) => {
    const rateOk = item.defaultTaxRateId && verified.some((r) => r.id === item.defaultTaxRateId);
    setDraft((d) =>
      d
        ? {
            ...d,
            lines: [
              ...d.lines.filter((l) => l.designation.trim() || l.unitPrice.trim()),
              {
                lineType: item.lineType,
                designation: item.designation,
                quantity: "1",
                unit: item.unit,
                unitPrice: centsToInput(item.unitPriceCents),
                discountPct: "0",
                taxRateId: rateOk ? (item.defaultTaxRateId as string) : defaultRate,
              },
            ],
          }
        : d,
    );
    setShowCatalog(false);
  };

  const status = row?.status ?? draft?.status ?? "brouillon";
  const expired = status === "envoye" && row?.validUntil ? row.validUntil < new Date().toISOString().slice(0, 10) : false;
  const title = row?.number ? `Devis ${row.number}` : draft?.id ? "Devis (brouillon)" : "Nouveau devis";

  return (
    <Panel
      open
      wide
      title={title}
      subtitle={`${QUOTE_STATUS[status]}${expired ? " · validité dépassée" : ""}${selectedClient ? ` · ${displayClientName(selectedClient)}` : ""}`}
      onClose={onClose}
      footer={
        !draft ? null : editable ? (
          <>
            <button type="button" onClick={remove} disabled={busy} className="min-h-11 text-sm text-rouge-fonce underline underline-offset-4">
              {draft.id ? "Supprimer" : "Annuler"}
            </button>
            <div className="flex flex-wrap gap-2">
              {draft.id ? (
                <a href={`/admin/devis/${draft.id}`} target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-full border border-ligne px-4 text-sm text-nuit">
                  Aperçu
                </a>
              ) : null}
              <button type="button" onClick={save} disabled={busy} className="min-h-11 rounded-full border border-nuit px-5 text-sm text-nuit disabled:opacity-60">
                Enregistrer
              </button>
              <button type="button" onClick={send} disabled={busy || verified.length === 0} className="min-h-11 rounded-full bg-rouge px-5 text-sm font-semibold text-white disabled:opacity-60">
                Envoyer au client
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={duplicate} disabled={busy} className="min-h-11 text-sm text-nuit underline underline-offset-4">
              Dupliquer pour modifier
            </button>
            <div className="flex flex-wrap gap-2">
              <a href={`/admin/devis/${draft.id}`} target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-full border border-ligne px-4 text-sm text-nuit">
                Voir / imprimer
              </a>
              {status === "envoye" ? (
                <>
                  <button type="button" onClick={() => setStatus("refuse")} disabled={busy} className="min-h-11 rounded-full border border-ligne px-4 text-sm text-nuit">
                    Refusé
                  </button>
                  <button type="button" onClick={() => setStatus("accepte")} disabled={busy} className="min-h-11 rounded-full bg-nuit px-5 text-sm font-semibold text-white">
                    Accepté
                  </button>
                </>
              ) : null}
              {status === "accepte" && row ? (
                <button type="button" onClick={() => onSchedule(row)} className="min-h-11 rounded-full bg-rouge px-5 text-sm font-semibold text-white">
                  Planifier l&apos;intervention
                </button>
              ) : null}
            </div>
          </>
        )
      }
    >
      {!draft ? (
        <div className="space-y-4">
          <ErrorNote message={error} />
          {!error ? <p className="py-8 text-center text-discret">Chargement…</p> : null}
        </div>
      ) : (
        <div className="space-y-7">
          <ErrorNote message={error} />

          {editable && verified.length === 0 ? (
            <p className="rounded-lg border border-rouge/30 bg-rouge/5 px-4 py-3 text-sm text-rouge-fonce">
              Aucun taux de TVA n&apos;est validé. Ouvrez <strong>Réglages → TVA</strong> et validez les taux (avec votre comptable) avant de chiffrer un devis.
            </p>
          ) : null}

          {link ? (
            <div className="rounded-xl bg-fond p-4">
              <p className={labelClass}>Lien du devis pour le client</p>
              <p className="mt-1 text-sm break-all text-nuit">{link}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={copyLink} className="min-h-10 rounded-full bg-nuit px-4 text-sm text-white">Copier le lien</button>
                {row?.clientPhone ? (
                  <a
                    href={`sms:${row.clientPhone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(`Bonjour, voici votre devis Électricité N.A.B. : ${link}`)}`}
                    className="flex min-h-10 items-center rounded-full border border-ligne px-4 text-sm text-nuit"
                  >
                    Envoyer par SMS
                  </a>
                ) : null}
                {status === "envoye" ? (
                  <button type="button" onClick={resend} disabled={busy} className="min-h-10 rounded-full border border-ligne px-4 text-sm text-nuit">
                    Renvoyer l&apos;e-mail
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Client */}
          <section>
            <h3 className="font-titre text-xl font-bold text-nuit">Client</h3>
            {selectedClient ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-ligne px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-nuit">{displayClientName(selectedClient)}</p>
                  <p className="truncate text-sm text-discret">{[selectedClient.phone, selectedClient.email].filter(Boolean).join(" · ") || "Aucun contact"}</p>
                </div>
                {editable ? (
                  <button type="button" onClick={() => set({ clientId: "", siteId: "" })} className="min-h-10 shrink-0 text-sm text-nuit underline underline-offset-4">
                    Changer
                  </button>
                ) : null}
              </div>
            ) : newClient ? (
              <div className="mt-2 space-y-3 rounded-lg border border-ligne p-4">
                <ClientForm value={newClient} onChange={setNewClient} />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setNewClient(null)} className="min-h-10 px-3 text-sm text-discret underline">Annuler</button>
                  <button type="button" onClick={createClient} disabled={busy} className="min-h-10 rounded-full bg-nuit px-4 text-sm text-white">Créer le client</button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <label htmlFor="qe-client" className="sr-only">Rechercher un client</label>
                <input id="qe-client" type="search" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Rechercher un client…" className={fieldClass} />
                <ul className="mt-2 divide-y divide-ligne rounded-lg border border-ligne">
                  {filteredClients.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => set({ clientId: c.id, siteId: "" })} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm">
                        <span className="truncate font-semibold text-nuit">{displayClientName(c)}</span>
                        <span className="shrink-0 text-discret">{c.city ?? c.phone ?? ""}</span>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button type="button" onClick={() => setNewClient(emptyClient())} className="min-h-11 w-full px-3 text-left text-sm text-nuit underline underline-offset-4">
                      + Nouveau client
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {draft.clientId ? (
              <div className="mt-4">
                <label htmlFor="qe-site" className={labelClass}>Adresse du chantier</label>
                <select id="qe-site" value={draft.siteId} onChange={(e) => set({ siteId: e.target.value })} disabled={!editable} className={fieldClass}>
                  <option value="">{sites.length ? "— Choisir une adresse —" : "— Nouvelle adresse ci-dessous —"}</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{`${s.addressLine}, ${s.postalCode} ${s.city}`}</option>
                  ))}
                </select>
                {editable && !draft.siteId ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_6.5rem_1fr]">
                    <input aria-label="Adresse" placeholder="Nouvelle adresse (facultatif)" value={newSite.addressLine} onChange={(e) => setNewSite({ ...newSite, addressLine: e.target.value })} className={fieldClass} />
                    <input aria-label="Code postal" placeholder="CP" inputMode="numeric" value={newSite.postalCode} onChange={(e) => setNewSite({ ...newSite, postalCode: e.target.value })} className={fieldClass} />
                    <input aria-label="Ville" placeholder="Ville" value={newSite.city} onChange={(e) => setNewSite({ ...newSite, city: e.target.value })} className={fieldClass} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Objet */}
          <section>
            <label htmlFor="qe-title" className={labelClass}>Objet du devis</label>
            <input id="qe-title" value={draft.title} onChange={(e) => set({ title: e.target.value })} disabled={!editable} placeholder="Ex. Remplacement du tableau électrique" className={fieldClass} />
          </section>

          {/* Lignes */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-titre text-xl font-bold text-nuit">Lignes</h3>
              {editable && catalog.length ? (
                <button type="button" onClick={() => setShowCatalog(!showCatalog)} className="min-h-10 text-sm text-nuit underline underline-offset-4">
                  {showCatalog ? "Fermer la bibliothèque" : "Depuis la bibliothèque"}
                </button>
              ) : null}
            </div>
            {showCatalog ? (
              <ul className="mt-2 max-h-60 divide-y divide-ligne overflow-y-auto rounded-lg border border-ligne">
                {catalog.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => insertCatalog(c)} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm">
                      <span className="truncate">{c.designation}</span>
                      <span className="shrink-0 text-discret">{formatEuros(c.unitPriceCents)} / {c.unit}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <ol className="mt-3 space-y-3">
              {draft.lines.map((l, i) => {
                const isText = l.lineType === "texte";
                const total = isText ? 0 : Math.round(parseDecimal(l.quantity) * parseEurosToCents(l.unitPrice) * (1 - parseDecimal(l.discountPct) / 100));
                const lineRate = rates.find((r) => r.id === l.taxRateId);
                return (
                  <li key={i} className="rounded-xl border border-ligne p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select aria-label="Type de ligne" value={l.lineType} disabled={!editable} onChange={(e) => setLine(i, { lineType: e.target.value as LineType })} className="min-h-10 rounded-lg border border-ligne bg-white px-2 text-sm">
                        {(Object.entries(LINE_TYPES) as [LineType, string][]).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <span className="ml-auto font-semibold text-nuit tabular-nums">{isText ? "" : formatEuros(total)}</span>
                      {editable ? (
                        <span className="flex gap-1">
                          <button type="button" aria-label="Monter la ligne" onClick={() => moveLine(i, -1)} disabled={i === 0} className="size-9 rounded-lg border border-ligne text-nuit disabled:opacity-30">↑</button>
                          <button type="button" aria-label="Descendre la ligne" onClick={() => moveLine(i, 1)} disabled={i === draft.lines.length - 1} className="size-9 rounded-lg border border-ligne text-nuit disabled:opacity-30">↓</button>
                          <button type="button" aria-label="Supprimer la ligne" onClick={() => set({ lines: draft.lines.filter((_, j) => j !== i) })} className="size-9 rounded-lg border border-ligne text-rouge-fonce">×</button>
                        </span>
                      ) : null}
                    </div>
                    <textarea
                      aria-label="Désignation"
                      rows={isText ? 1 : 2}
                      value={l.designation}
                      disabled={!editable}
                      onChange={(e) => setLine(i, { designation: e.target.value })}
                      placeholder={isText ? "Titre de section ou remarque" : "Désignation (ex. Fourniture et pose d'un interrupteur différentiel 40 A type A)"}
                      className={`${fieldClass} resize-y`}
                    />
                    {!isText ? (
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <div>
                          <label className={labelClass} htmlFor={`q-${i}`}>Qté</label>
                          <input id={`q-${i}`} inputMode="decimal" value={l.quantity} disabled={!editable} onChange={(e) => setLine(i, { quantity: e.target.value })} className={fieldClass} />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`u-${i}`}>Unité</label>
                          <input id={`u-${i}`} list="qe-units" value={l.unit} disabled={!editable} onChange={(e) => setLine(i, { unit: e.target.value })} className={fieldClass} />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`p-${i}`}>PU HT €</label>
                          <input id={`p-${i}`} inputMode="decimal" value={l.unitPrice} disabled={!editable} onChange={(e) => setLine(i, { unitPrice: e.target.value })} placeholder="0,00" className={fieldClass} />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`r-${i}`}>Remise %</label>
                          <input id={`r-${i}`} inputMode="decimal" value={l.discountPct} disabled={!editable} onChange={(e) => setLine(i, { discountPct: e.target.value })} className={fieldClass} />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className={labelClass} htmlFor={`t-${i}`}>TVA</label>
                          <select id={`t-${i}`} value={l.taxRateId} disabled={!editable} onChange={(e) => setLine(i, { taxRateId: e.target.value })} className={fieldClass}>
                            <option value="">—</option>
                            {(editable ? verified : rates).map((r) => (
                              <option key={r.id} value={r.id}>{`${String(r.rate).replace(".", ",")} %`}</option>
                            ))}
                            {editable && lineRate && !lineRate.verifiedAt ? (
                              <option value={lineRate.id}>{`${String(lineRate.rate).replace(".", ",")} % (non validé)`}</option>
                            ) : null}
                          </select>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <datalist id="qe-units">
              {UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
            {editable ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(["prestation", "fourniture", "main_oeuvre", "deplacement", "texte"] as LineType[]).map((t) => (
                  <button key={t} type="button" onClick={() => set({ lines: [...draft.lines, emptyLine(defaultRate, t)] })} className="min-h-10 rounded-full border border-ligne px-3 text-sm text-nuit">
                    + {LINE_TYPES[t]}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {/* Totaux */}
          {totals ? (
            <section className="rounded-xl bg-fond p-4">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="qe-disc" className="text-sm text-texte">Remise globale (%)</label>
                <input id="qe-disc" inputMode="decimal" value={draft.globalDiscountPct} disabled={!editable} onChange={(e) => set({ globalDiscountPct: e.target.value })} className="w-24 rounded-lg border border-ligne bg-white px-3 py-2 text-right" />
              </div>
              <dl className="mt-3 space-y-1 text-sm tabular-nums">
                <div className="flex justify-between"><dt>Sous-total HT</dt><dd>{formatEuros(totals.subtotalCents)}</dd></div>
                {totals.discountCents ? (
                  <div className="flex justify-between"><dt>Remise</dt><dd>− {formatEuros(totals.discountCents)}</dd></div>
                ) : null}
                <div className="flex justify-between font-semibold"><dt>Total HT</dt><dd>{formatEuros(totals.htCents)}</dd></div>
                {totals.vatBreakdown.map((v) => (
                  <div key={v.rate} className="flex justify-between text-discret">
                    <dt>TVA {String(v.rate).replace(".", ",")} % sur {formatEuros(v.baseCents)}</dt>
                    <dd>{formatEuros(v.vatCents)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-ligne pt-2 font-titre text-2xl font-bold text-nuit"><dt>Total TTC</dt><dd>{formatEuros(totals.ttcCents)}</dd></div>
              </dl>
            </section>
          ) : null}

          {/* Notes */}
          <section className="grid gap-4">
            <div>
              <label htmlFor="qe-conditions" className={labelClass}>Conditions particulières (visibles par le client)</label>
              <textarea id="qe-conditions" rows={3} value={draft.conditions} disabled={!editable} onChange={(e) => set({ conditions: e.target.value })} placeholder="Ex. Acompte de 30 % à la commande, délai d'approvisionnement du matériel…" className={`${fieldClass} resize-y`} />
            </div>
            <div>
              <label htmlFor="qe-notes" className={labelClass}>Notes internes (non visibles)</label>
              <textarea id="qe-notes" rows={2} value={draft.notes} disabled={!editable} onChange={(e) => set({ notes: e.target.value })} className={`${fieldClass} resize-y`} />
            </div>
          </section>
        </div>
      )}
    </Panel>
  );
}
