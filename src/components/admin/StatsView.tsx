"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminStore, VisitStats } from "@/lib/admin/store";
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

const PAGE_NAMES: Record<string, string> = {
  "/": "Accueil",
  "/contact": "Contact",
  "/devis": "Demande de devis",
  "/depannage": "Dépannage",
  "/prestations": "Prestations",
  "/realisations": "Réalisations",
  "/a-propos": "À propos",
  "/zone-intervention": "Zone d'intervention",
  "/mentions-legales": "Mentions légales",
  "/politique-de-confidentialite": "Confidentialité",
};
const pageName = (p: string) => PAGE_NAMES[p] ?? (p.startsWith("/prestations/") ? `Prestation : ${p.slice(13).replace(/-/g, " ")}` : p);

const isoDay = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

function VisitsChart({ days, from }: { days: VisitStats["days"]; from: number }) {
  // Une colonne par jour (30 derniers jours au maximum), les jours sans visite à zéro.
  const start = Math.max(from, Date.now() - 29 * 86_400_000);
  const map = new Map(days.map((d) => [d.day, d.visitors]));
  const cols: { day: string; v: number }[] = [];
  for (let t = start; t <= Date.now(); t += 86_400_000) {
    const day = isoDay(new Date(t));
    if (!cols.some((c) => c.day === day)) cols.push({ day, v: map.get(day) ?? 0 });
  }
  const max = Math.max(1, ...cols.map((c) => c.v));
  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]" role="img" aria-label="Visiteurs par jour">
        {cols.map((c) => (
          <div key={c.day} className="group relative flex-1">
            <div className={`w-full rounded-t-[3px] ${c.v ? "bg-nuit" : "bg-ligne"}`} style={{ height: `${c.v ? Math.max(6, (c.v / max) * 112) : 3}px` }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-encre px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
              {new Date(`${c.day}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} : {c.v}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-discret">
        <span>{cols[0] ? new Date(`${cols[0].day}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
        <span>Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

export function StatsView({ store, requests }: { store: AdminStore; requests: RequestItem[] }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("30j");
  const [interventions, setInterventions] = useState<StatIntervention[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visits, setVisits] = useState<VisitStats | null>(null);

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

  useEffect(() => {
    setVisits(null);
    store
      .visitStats(since ? isoDay(new Date(since)) : null)
      .then(setVisits)
      .catch(() => setVisits({ views: 0, visitors: 0, today: 0, days: [], pages: [], sources: [], devices: [] }));
  }, [store, since]);

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

      <section className="rounded-xl border border-ligne bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-titre text-xl font-bold text-nuit">Visites du site</h2>
          <span className="text-sm text-discret">Aujourd&apos;hui : <strong className="text-nuit">{visits?.today ?? "…"}</strong> visiteur{(visits?.today ?? 0) > 1 ? "s" : ""}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs tracking-widest text-discret uppercase">Visiteurs</p>
            <p className="mt-1 font-titre text-4xl font-bold text-nuit tabular-nums">{visits ? visits.visitors : "…"}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-discret uppercase">Pages vues</p>
            <p className="mt-1 font-titre text-4xl font-bold text-nuit tabular-nums">{visits ? visits.views : "…"}</p>
          </div>
        </div>
        {visits ? (
          <div className="mt-5">
            <VisitsChart days={visits.days} from={since || Date.now() - 29 * 86_400_000} />
          </div>
        ) : null}
        <p className="mt-3 text-xs text-discret">Comptage sans cookie, à partir du 6 novembre 2026. Vos propres visites (connecté à l&apos;admin) ne sont pas comptées.</p>
      </section>

      {visits && visits.views > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          <Bars title="Pages les plus vues" rows={visits.pages.map((p) => ({ label: pageName(p.label), value: p.value }))} />
          <Bars title="D'où viennent les visiteurs" rows={visits.sources.map((s) => ({ label: s.label === "direct" ? "Accès direct" : s.label.charAt(0).toUpperCase() + s.label.slice(1), value: s.value }))} />
          <Bars title="Appareils" rows={visits.devices.map((d) => ({ label: d.label.charAt(0).toUpperCase() + d.label.slice(1), value: d.value }))} />
        </div>
      ) : null}

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
