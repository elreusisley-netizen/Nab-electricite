"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LINE_TYPES,
  type CatalogItem,
  type CommercialStore,
  type CompanySettings,
  type LineType,
  type TaxRate,
} from "@/lib/admin/commercial";
import { centsToInput, formatEuros, parseEurosToCents } from "@/lib/admin/quote-math";
import { AccountsView } from "./AccountsView";
import { ErrorNote, Panel, Segmented, fieldClass, labelClass } from "./ui";

type Tab = "entreprise" | "tva" | "bibliotheque" | "comptes";

type CatalogForm = { id?: string; lineType: LineType; designation: string; unit: string; unitPrice: string; taxRateId: string };

interface Props {
  store: CommercialStore;
  onToast: (m: string) => void;
}

export function SettingsView({ store, onToast }: Props) {
  const [tab, setTab] = useState<Tab>("entreprise");
  return (
    <div className="space-y-5">
      <Segmented
        label="Réglages"
        value={tab}
        onChange={setTab}
        options={[
          { key: "entreprise", label: "Entreprise" },
          { key: "tva", label: "TVA" },
          { key: "bibliotheque", label: "Bibliothèque de prix" },
          { key: "comptes", label: "Comptes" },
        ]}
      />
      {tab === "entreprise" ? <CompanyTab store={store} onToast={onToast} /> : null}
      {tab === "tva" ? <TaxTab store={store} onToast={onToast} /> : null}
      {tab === "bibliotheque" ? <CatalogTab store={store} onToast={onToast} /> : null}
      {tab === "comptes" ? <AccountsView onToast={onToast} /> : null}
    </div>
  );
}

function CompanyTab({ store, onToast }: Props) {
  const [s, setS] = useState<CompanySettings | null>(null);
  const [capital, setCapital] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    store
      .getSettings()
      .then((r) => {
        setS(r);
        setCapital(r.shareCapitalCents !== null ? centsToInput(r.shareCapitalCents) : "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Chargement impossible."));
  }, [store]);

  if (!s) return error ? <ErrorNote message={error} /> : <p className="text-discret">Chargement…</p>;

  const set = (patch: Partial<CompanySettings>) => setS({ ...s, ...patch });
  const txt = (v: string) => (v.trim() === "" ? null : v);

  async function save() {
    if (!s) return;
    setBusy(true);
    setError(null);
    try {
      await store.saveSettings({ ...s, shareCapitalCents: capital.trim() ? parseEurosToCents(capital) : null });
      onToast("Réglages enregistrés");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 rounded-xl border border-ligne bg-white p-5 md:p-7">
      <p className="text-sm text-texte">
        Ces informations apparaissent sur chaque devis. Les champs vides s&apos;affichent « à compléter » : renseignez-les avant d&apos;envoyer vos premiers devis.
      </p>
      <ErrorNote message={error} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="st-office" className={labelClass}>Adresse du siège (mentions du devis)</label>
          <input id="st-office" value={s.headOfficeAddress ?? ""} onChange={(e) => set({ headOfficeAddress: txt(e.target.value) })} placeholder="25 rue Raymond Lavigne, 33100 Bordeaux" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="st-capital" className={labelClass}>Capital social (€)</label>
          <input id="st-capital" inputMode="decimal" value={capital} onChange={(e) => setCapital(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="st-validity" className={labelClass}>Validité des devis (jours)</label>
          <input id="st-validity" type="number" min={1} max={365} value={s.quoteValidityDays} onChange={(e) => set({ quoteValidityDays: Number(e.target.value) || 30 })} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="st-insurer" className={labelClass}>Assureur décennale</label>
          <input id="st-insurer" value={s.insurerName ?? ""} onChange={(e) => set({ insurerName: txt(e.target.value) })} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="st-policy" className={labelClass}>N° de contrat</label>
          <input id="st-policy" value={s.insurancePolicyNumber ?? ""} onChange={(e) => set({ insurancePolicyNumber: txt(e.target.value) })} className={fieldClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="st-coverage" className={labelClass}>Couverture géographique de l&apos;assurance</label>
          <input id="st-coverage" value={s.insurerCoverage ?? ""} onChange={(e) => set({ insurerCoverage: txt(e.target.value) })} placeholder="Ex. France métropolitaine" className={fieldClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="st-payment" className={labelClass}>Conditions de paiement</label>
          <textarea id="st-payment" rows={2} value={s.paymentTerms ?? ""} onChange={(e) => set({ paymentTerms: txt(e.target.value) })} placeholder="Ex. Acompte de 30 % à la signature, solde à la fin des travaux." className={`${fieldClass} resize-y`} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="st-mentions" className={labelClass}>Mentions complémentaires (bas de devis)</label>
          <textarea id="st-mentions" rows={3} value={s.quoteLegalMentions ?? ""} onChange={(e) => set({ quoteLegalMentions: txt(e.target.value) })} placeholder="Ex. pénalités de retard, indemnité forfaitaire de recouvrement (clients pros)…" className={`${fieldClass} resize-y`} />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={busy} className="min-h-12 rounded-full bg-nuit px-7 font-semibold text-white disabled:opacity-60">
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

function TaxTab({ store, onToast }: Props) {
  const [rates, setRates] = useState<TaxRate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    store
      .listTaxRates()
      .then(setRates)
      .catch((e) => setError(e instanceof Error ? e.message : "Chargement impossible."));
  }, [store]);
  useEffect(load, [load]);

  async function toggle(r: TaxRate) {
    const validate = !r.verifiedAt;
    if (validate && !window.confirm(`Valider « ${r.label} » (${String(r.rate).replace(".", ",")} %) ? Confirmez d'abord ce taux et ses conditions avec votre comptable.`)) return;
    try {
      await store.setTaxRateVerified(r.id, validate);
      onToast(validate ? "Taux validé" : "Taux désactivé");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    }
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-ligne bg-white p-4 text-sm text-texte">
        Un taux doit être validé pour être utilisé dans un devis. Les taux réduits (10 % et 5,5 %) ne s&apos;appliquent qu&apos;à certains travaux dans des logements de plus de deux ans, avec une attestation du client : vérifiez-les avec votre comptable.
      </p>
      <ErrorNote message={error} />
      {rates === null ? (
        <p className="text-discret">Chargement…</p>
      ) : (
        <ul className="divide-y divide-ligne rounded-xl border border-ligne bg-white">
          {rates.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-4 py-4">
              <span className="font-titre text-2xl font-bold text-nuit tabular-nums">{String(r.rate).replace(".", ",")} %</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-nuit">{r.label}</span>
                <span className="block text-xs text-discret">
                  {r.verifiedAt ? `Validé le ${new Date(r.verifiedAt).toLocaleDateString("fr-FR")}` : r.notes ?? "Non validé"}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(r.verifiedAt)}
                aria-label={`Taux ${r.rate} % utilisable`}
                onClick={() => toggle(r)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${r.verifiedAt ? "bg-nuit" : "bg-ligne"}`}
              >
                <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${r.verifiedAt ? "left-7" : "left-1"}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CatalogTab({ store, onToast }: Props) {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [editing, setEditing] = useState<CatalogForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([store.listCatalog(), store.listTaxRates()]);
      setItems(c);
      setRates(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [store]);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await store.saveCatalogItem(editing);
      onToast("Article enregistré");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!editing?.id || !window.confirm("Retirer cet article de la bibliothèque ?")) return;
    setBusy(true);
    try {
      await store.archiveCatalogItem(editing.id);
      onToast("Article retiré");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opération impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texte">Vos prestations et fournitures habituelles, à insérer en un geste dans un devis.</p>
        <button
          type="button"
          onClick={() => setEditing({ lineType: "prestation", designation: "", unit: "u", unitPrice: "", taxRateId: rates.find((r) => r.verifiedAt)?.id ?? "" })}
          className="min-h-11 rounded-full bg-nuit px-5 text-sm text-white"
        >
          + Ajouter un article
        </button>
      </div>
      {!editing ? <ErrorNote message={error} /> : null}
      {items === null ? (
        <p className="text-discret">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-ligne bg-white p-8 text-center text-discret">La bibliothèque est vide. Ajoutez vos tarifs habituels.</p>
      ) : (
        <ul className="divide-y divide-ligne rounded-xl border border-ligne bg-white">
          {items.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() =>
                  setEditing({ id: i.id, lineType: i.lineType, designation: i.designation, unit: i.unit, unitPrice: centsToInput(i.unitPriceCents), taxRateId: i.defaultTaxRateId ?? "" })
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-nuit">{i.designation}</span>
                  <span className="block text-xs text-discret">{LINE_TYPES[i.lineType]}</span>
                </span>
                <span className="shrink-0 text-sm text-nuit tabular-nums">{formatEuros(i.unitPriceCents)} HT / {i.unit}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Panel
        open={editing !== null}
        title={editing?.id ? "Modifier l'article" : "Nouvel article"}
        onClose={() => setEditing(null)}
        footer={
          <>
            {editing?.id ? (
              <button type="button" onClick={archive} disabled={busy} className="min-h-11 text-sm text-rouge-fonce underline underline-offset-4">Retirer</button>
            ) : (
              <span />
            )}
            <button type="button" onClick={save} disabled={busy} className="min-h-12 rounded-full bg-nuit px-7 font-semibold text-white disabled:opacity-60">Enregistrer</button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <ErrorNote message={error} />
            <div>
              <label htmlFor="ca-type" className={labelClass}>Type</label>
              <select id="ca-type" value={editing.lineType} onChange={(e) => setEditing({ ...editing, lineType: e.target.value as LineType })} className={fieldClass}>
                {(Object.entries(LINE_TYPES) as [LineType, string][])
                  .filter(([k]) => k !== "texte")
                  .map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="ca-des" className={labelClass}>Désignation</label>
              <textarea id="ca-des" rows={2} value={editing.designation} onChange={(e) => setEditing({ ...editing, designation: e.target.value })} className={`${fieldClass} resize-y`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ca-price" className={labelClass}>Prix unitaire HT (€)</label>
                <input id="ca-price" inputMode="decimal" value={editing.unitPrice} onChange={(e) => setEditing({ ...editing, unitPrice: e.target.value })} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="ca-unit" className={labelClass}>Unité</label>
                <input id="ca-unit" value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} className={fieldClass} />
              </div>
            </div>
            <div>
              <label htmlFor="ca-tva" className={labelClass}>TVA par défaut</label>
              <select id="ca-tva" value={editing.taxRateId} onChange={(e) => setEditing({ ...editing, taxRateId: e.target.value })} className={fieldClass}>
                <option value="">—</option>
                {rates.map((r) => (
                  <option key={r.id} value={r.id}>{`${String(r.rate).replace(".", ",")} %${r.verifiedAt ? "" : " (non validé)"}`}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
