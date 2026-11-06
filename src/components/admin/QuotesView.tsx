"use client";

import { useEffect, useMemo, useState } from "react";
import { QUOTE_STATUS, type CommercialStore, type QuoteRow, type QuoteStatus } from "@/lib/admin/commercial";
import { formatEuros } from "@/lib/admin/quote-math";
import { Segmented } from "./ui";

type Filter = "tous" | "brouillon" | "envoye" | "accepte" | "clos";

const BADGE: Record<QuoteStatus, string> = {
  brouillon: "bg-fond text-nuit",
  envoye: "bg-nuit text-white",
  accepte: "bg-emerald-600 text-white",
  refuse: "bg-ligne text-discret",
  expire: "bg-ligne text-discret",
};

const today = () => new Date().toISOString().slice(0, 10);
const isExpired = (q: QuoteRow) => q.status === "expire" || (q.status === "envoye" && !!q.validUntil && q.validUntil < today());

export function QuoteBadge({ q }: { q: QuoteRow }) {
  const expired = isExpired(q);
  const status: QuoteStatus = expired ? "expire" : q.status;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${BADGE[status]}`}>{QUOTE_STATUS[status]}</span>;
}

interface Props {
  store: CommercialStore;
  refreshKey: number;
  onOpen: (id: string) => void;
  onNew: () => void;
}

export function QuotesView({ store, refreshKey, onOpen, onNew }: Props) {
  const [quotes, setQuotes] = useState<QuoteRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("tous");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    store
      .listQuotes()
      .then((r) => {
        setQuotes(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Chargement impossible."));
  }, [store, refreshKey]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (quotes ?? []).filter((x) => {
      const expired = isExpired(x);
      if (filter === "brouillon" && x.status !== "brouillon") return false;
      if (filter === "envoye" && (x.status !== "envoye" || expired)) return false;
      if (filter === "accepte" && x.status !== "accepte") return false;
      if (filter === "clos" && !(x.status === "refuse" || expired)) return false;
      if (!term) return true;
      return [x.number, x.title, x.clientName].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [quotes, filter, q]);

  const all = quotes ?? [];
  const pending = all.filter((x) => x.status === "envoye" && !isExpired(x));
  const accepted = all.filter((x) => x.status === "accepte");
  const sum = (rows: QuoteRow[]) => rows.reduce((s, r) => s + r.totalHtCents, 0);

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-lg bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Brouillons", value: String(all.filter((x) => x.status === "brouillon").length) },
          { label: "En attente de réponse", value: String(pending.length) },
          { label: "Montant en attente (HT)", value: formatEuros(sum(pending)) },
          { label: "Acceptés (HT)", value: formatEuros(sum(accepted)) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ligne bg-white p-4">
            <span className="block text-[0.7rem] tracking-widest text-discret uppercase">{s.label}</span>
            <span className="mt-1 block font-titre text-2xl font-bold text-nuit tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="qv-search" className="sr-only">Rechercher un devis</label>
        <input id="qv-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Numéro, client, objet…" className="min-h-11 min-w-[14rem] flex-1 rounded-full border border-ligne bg-white px-4" />
        <button type="button" onClick={onNew} className="min-h-11 rounded-full bg-nuit px-5 text-sm text-white">+ Nouveau devis</button>
      </div>

      <Segmented
        label="Statut des devis"
        value={filter}
        onChange={setFilter}
        options={[
          { key: "tous", label: "Tous" },
          { key: "brouillon", label: "Brouillons" },
          { key: "envoye", label: "Envoyés", badge: pending.length },
          { key: "accepte", label: "Acceptés" },
          { key: "clos", label: "Refusés / expirés" },
        ]}
      />

      {quotes === null ? (
        <p className="py-8 text-center text-discret">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-ligne bg-white p-8 text-center text-discret">
          {all.length === 0 ? "Aucun devis pour l'instant." : "Aucun devis dans cette sélection."}
        </p>
      ) : (
        <ul className="divide-y divide-ligne rounded-xl border border-ligne bg-white">
          {list.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => onOpen(x.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-nuit">
                    {x.number ?? "Brouillon"} · {x.clientName}
                  </span>
                  <span className="block truncate text-sm text-discret">
                    {x.title ?? "Sans objet"}
                    {x.validUntil && x.status === "envoye" ? ` · valable jusqu'au ${new Date(`${x.validUntil}T12:00:00`).toLocaleDateString("fr-FR")}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold text-nuit tabular-nums">{formatEuros(x.totalTtcCents)}</span>
                  <QuoteBadge q={x} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
