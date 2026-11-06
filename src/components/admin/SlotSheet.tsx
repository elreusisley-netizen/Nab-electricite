"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { longDate } from "@/lib/admin/dates";
import { INTERVENTION_STATUS, SLOT_STATUSES, type SlotInput } from "@/lib/admin/types";
import { allServices, clientTypes, type ClientType } from "@/lib/labels";

const field =
  "mt-1.5 w-full rounded-lg border border-ligne bg-white px-3 py-2.5 text-base text-encre focus:border-nuit focus:outline-none";
const label = "block text-[0.7rem] font-semibold tracking-widest text-discret uppercase";

interface Props {
  initial: SlotInput | null;
  onClose: () => void;
  onSave: (s: SlotInput) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
}

/** Fiche d'un créneau : panneau du bas sur mobile, panneau latéral sur ordinateur. */
export function SlotSheet({ initial, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<SlotInput | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(initial);
    setError(null);
    setConfirmDelete(false);
  }, [initial]);

  useEffect(() => {
    if (!initial) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [initial, onClose]);

  if (!form) return null;

  const set = <K extends keyof SlotInput>(k: K, v: SlotInput[K]) => setForm({ ...form, [k]: v });
  const isBlock = form.kind === "blocage";
  const isNew = !form.slotId;
  const address = [form.addressLine, `${form.postalCode} ${form.city}`.trim()].filter(Boolean).join(", ");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.date) return setError("Choisissez une date.");
    setBusy(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form?.slotId) return;
    setBusy(true);
    try {
      await onDelete(form.slotId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div className="absolute inset-0 bg-nuit/40" onClick={onClose} aria-hidden />
      <form
        onSubmit={submit}
        noValidate
        className="absolute inset-x-0 bottom-0 flex max-h-[92svh] flex-col rounded-t-2xl bg-white shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[32rem] md:rounded-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-ligne px-5 pt-5 pb-4 md:px-7">
          <div>
            <h2 id="sheet-title" className="font-titre text-3xl font-bold text-nuit">
              {isBlock ? (isNew ? "Bloquer un créneau" : "Indisponibilité") : isNew ? "Nouvelle intervention" : "Intervention"}
            </h2>
            {form.date ? <p className="mt-1 text-sm text-discret first-letter:uppercase">{longDate(form.date)}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-11 shrink-0 place-items-center text-nuit">
            <Icon name="close" size={22} strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-7">
          {isNew && !form.requestId ? (
            <div role="radiogroup" aria-label="Type de créneau" className="flex rounded-full border border-ligne bg-fond p-1">
              {(["intervention", "blocage"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === k}
                  onClick={() => setForm({ ...form, kind: k, end: k === "blocage" ? "18:00" : form.end })}
                  className={`min-h-10 flex-1 rounded-full text-sm ${form.kind === k ? "bg-nuit text-white" : "text-nuit"}`}
                >
                  {k === "intervention" ? "Intervention" : "Indisponibilité"}
                </button>
              ))}
            </div>
          ) : null}

          {!isNew && !isBlock && (form.phone || address) ? (
            <div className="grid grid-cols-2 gap-2">
              {form.phone ? (
                <a href={`tel:${form.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rouge font-semibold text-white">
                  <Icon name="phone" size={18} strokeWidth={2} /> Appeler
                </a>
              ) : null}
              {address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-nuit font-semibold text-nuit"
                >
                  <Icon name="pin" size={18} strokeWidth={2} /> Itinéraire
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="sl-date" className={label}>Date *</label>
              <input id="sl-date" type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="sl-start" className={label}>Début</label>
              <input id="sl-start" type="time" value={form.start} onChange={(e) => set("start", e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="sl-end" className={label}>Fin</label>
              <input id="sl-end" type="time" value={form.end} onChange={(e) => set("end", e.target.value)} className={field} />
            </div>
          </div>

          {isBlock ? (
            <div>
              <label htmlFor="sl-note" className={label}>Motif (facultatif)</label>
              <input id="sl-note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Congés, rendez-vous…" className={field} />
            </div>
          ) : (
            <>
              <div>
                <span className={label}>Statut</span>
                <div role="radiogroup" aria-label="Statut" className="mt-2 flex flex-wrap gap-2">
                  {SLOT_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={form.status === s}
                      onClick={() => set("status", s)}
                      className={`min-h-10 rounded-full border px-3.5 text-sm ${
                        form.status === s ? "border-nuit bg-nuit text-white" : "border-ligne bg-white text-nuit"
                      }`}
                    >
                      {INTERVENTION_STATUS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sl-service" className={label}>Type de travaux *</label>
                  <select id="sl-service" value={form.service} onChange={(e) => set("service", e.target.value as SlotInput["service"])} className={field}>
                    <option value="">Choisir…</option>
                    {Object.entries(allServices).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sl-title" className={label}>Intitulé</label>
                  <input id="sl-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Remplacement tableau" className={field} />
                </div>
              </div>

              <fieldset className="space-y-4 rounded-xl border border-ligne p-4">
                <legend className="px-1 font-titre text-lg font-bold text-nuit">Client</legend>
                <div role="radiogroup" aria-label="Type de client" className="flex gap-2">
                  {(Object.entries(clientTypes) as [ClientType, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={form.clientType === k}
                      onClick={() => set("clientType", k)}
                      className={`min-h-10 flex-1 rounded-full border text-sm ${form.clientType === k ? "border-nuit bg-nuit text-white" : "border-ligne text-nuit"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {form.clientType === "professionnel" ? (
                  <div>
                    <label htmlFor="sl-company" className={label}>Entreprise *</label>
                    <input id="sl-company" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} className={field} />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="sl-first" className={label}>Prénom</label>
                    <input id="sl-first" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={field} />
                  </div>
                  <div>
                    <label htmlFor="sl-last" className={label}>Nom{form.clientType === "particulier" ? " *" : ""}</label>
                    <input id="sl-last" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={field} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sl-phone" className={label}>Téléphone</label>
                    <input id="sl-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
                  </div>
                  <div>
                    <label htmlFor="sl-email" className={label}>E-mail</label>
                    <input id="sl-email" type="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
                  </div>
                </div>
                <div>
                  <label htmlFor="sl-address" className={label}>Adresse du chantier</label>
                  <input id="sl-address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} className={field} />
                </div>
                <div className="grid grid-cols-[7rem_1fr] gap-3">
                  <div>
                    <label htmlFor="sl-cp" className={label}>Code postal</label>
                    <input id="sl-cp" inputMode="numeric" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} className={field} />
                  </div>
                  <div>
                    <label htmlFor="sl-city" className={label}>Ville</label>
                    <input id="sl-city" value={form.city} onChange={(e) => set("city", e.target.value)} className={field} />
                  </div>
                </div>
              </fieldset>

              <div>
                <label htmlFor="sl-desc" className={label}>Description des travaux</label>
                <textarea id="sl-desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={`${field} resize-y`} />
              </div>
              <div>
                <label htmlFor="sl-notes" className={label}>Notes internes</label>
                <textarea
                  id="sl-notes"
                  rows={3}
                  value={form.internalNotes}
                  onChange={(e) => set("internalNotes", e.target.value)}
                  placeholder="Matériel à prévoir, code d'accès, contact sur place…"
                  className={`${field} resize-y`}
                />
              </div>
            </>
          )}

          {error ? (
            <p role="alert" className="rounded-lg bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-ligne px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-7">
          {form.slotId ? (
            confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                {isBlock ? "Supprimer ?" : "Retirer de l'agenda ?"}
                <button type="button" onClick={remove} disabled={busy} className="min-h-10 rounded-full bg-rouge px-4 text-white">
                  Oui
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-10 px-2 underline">
                  Non
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-10 text-sm text-rouge-fonce underline underline-offset-4">
                {isBlock ? "Supprimer" : "Retirer de l'agenda"}
              </button>
            )
          ) : (
            <span />
          )}
          <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-nuit px-7 font-semibold text-white disabled:opacity-60">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </footer>
      </form>
    </div>
  );
}
