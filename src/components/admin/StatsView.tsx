"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminStore } from "@/lib/admin/store";
import type { RequestItem, StatIntervention } from "@/lib/admin/types";
import { allServices } from "@/lib/labels";

const PERIODS = [
  { key: "30j", label: "30 jours", days: 30 },
  { key: "3m", label: "3 mois", days: 91 },
  { key: "12m", label: "12 mois", days: 365 },
  { key: "tout", label: "Tout", days: null },
] as const;

function Bars({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="rounded-xl border border-ligne bg-white p-5">
      <h2 className="font-titre text-xl font-bold text-nuit">{title}</h2>
      {rows.every((r) => r.value === 0) ? (
        <p className="mt-3 text-sm text-discret">Pas encore de données sur cette période.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows
            .filter((r) => r.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((r) => (
              <li key={r.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-encre">{r.label}</span>
                  <span className="font-semibold text-nuit tabular-nums">{r.value}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-fond">
                  <div className="h-2 rounded-full bg-nuit" style={{ width: `${(r.value / max) * 100}%` }} />
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

export function StatsView({ store, requests }: { store: AdminStore; requests: RequestItem[] }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("30j");
  const [interventions, setInterventions] = useState<StatIntervention[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    store
      .listInterventionsForStats()
      .then(setInterventions)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Chargement impossible."));
  }, [store]);

  const since = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)?.days;
    return days ? Date.now() - days * 86_400_000 : 0;
  }, [period]);

  const req = requests.filter((r) => new Date(r.receivedAt).getTime() >= since);
  const iv = (interventions ?? []).filter((i) => new Date(i.createdAt).getTime() >= since);
  const done = (interventions ?? []).filter((i) => i.completedAt && new Date(i.completedAt).getTime() >= since);

  const cards = [
    { label: "Demandes reçues", value: req.length },
    { label: "dont dépannages", value: req.filter((r) => r.kind === "depannage").length },
    { label: "Interventions créées", value: iv.length },
    { label: "Interventions terminées", value: done.length },
  ];

  const byService = Object.entries(allServices).map(([k, v]) => ({
    label: v,
    value: iv.filter((i) => i.service === k).length,
  }));
  const byClient = [
    { label: "Particuliers", value: iv.filter((i) => i.clientType === "particulier").length },
    { label: "Professionnels", value: iv.filter((i) => i.clientType === "professionnel").length },
  ];
  const requestServices = Object.entries(allServices).map(([k, v]) => ({
    label: v,
    value: req.filter((r) => r.service === k).length,
  }));

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Période" className="flex rounded-full border border-ligne bg-white p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={period === p.key}
            onClick={() => setPeriod(p.key)}
            className={`min-h-10 flex-1 rounded-full text-sm ${period === p.key ? "bg-nuit text-white" : "text-nuit"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error ? <p role="alert" className="rounded-lg bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-ligne bg-white p-5">
            <p className="text-xs tracking-widest text-discret uppercase">{c.label}</p>
            <p className="mt-2 font-titre text-4xl font-bold text-nuit tabular-nums">{interventions === null && c.label.startsWith("Interv") ? "…" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-ligne bg-white p-5 text-sm text-discret">
        Chiffre d&apos;affaires réalisé et prévisionnel, devis envoyés et taux d&apos;acceptation : disponibles avec le générateur
        de devis et le branchement de l&apos;outil de facturation (montants facturés et encaissés séparés).
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Bars title="Interventions par type de travaux" rows={byService} />
        <Bars title="Particuliers et professionnels" rows={byClient} />
        <Bars title="Demandes de devis par prestation" rows={requestServices} />
      </div>
    </div>
  );
}
