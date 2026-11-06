"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { todayISO } from "@/lib/admin/dates";
import { createAdminStore, type AdminStore } from "@/lib/admin/store";
import { emptySlot, type AgendaItem, type RequestItem, type SlotInput } from "@/lib/admin/types";
import type { RequestStatus } from "@/lib/labels";
import { AccountsView } from "./AccountsView";
import { AgendaView } from "./AgendaView";
import { RequestsView } from "./RequestsView";
import { SlotSheet } from "./SlotSheet";
import { StatsView } from "./StatsView";

type View = "agenda" | "demandes" | "statistiques" | "comptes";

function readView(): View {
  if (typeof window === "undefined") return "agenda";
  const v = new URLSearchParams(window.location.search).get("vue");
  return v === "demandes" || v === "statistiques" || v === "comptes" ? v : "agenda";
}

function toInput(item: AgendaItem): SlotInput {
  const base = emptySlot(item.date, item.kind);
  const iv = item.intervention;
  if (!iv) return { ...base, slotId: item.id, start: item.start, end: item.end, note: item.note ?? "" };
  return {
    ...base,
    slotId: item.id,
    start: item.start,
    end: item.end,
    interventionId: iv.id,
    clientId: iv.client.id,
    siteId: iv.site?.id,
    requestId: iv.requestId,
    title: iv.title,
    service: iv.service,
    status: iv.status === "a_planifier" ? "planifiee" : iv.status,
    description: iv.description ?? "",
    internalNotes: iv.internalNotes ?? "",
    clientType: iv.client.type,
    firstName: iv.client.firstName ?? "",
    lastName: iv.client.lastName ?? "",
    companyName: iv.client.companyName ?? "",
    phone: iv.client.phone ?? "",
    email: iv.client.email ?? "",
    addressLine: iv.site?.addressLine ?? "",
    postalCode: iv.site?.postalCode ?? "",
    city: iv.site?.city ?? "",
  };
}

export function AdminApp({ email }: { email: string }) {
  const store = useMemo<AdminStore>(() => createAdminStore(), []);
  const [view, setView] = useState<View>("agenda");
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [editing, setEditing] = useState<SlotInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setView(readView());
    const onPop = () => setView(readView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const load = useCallback(async () => {
    try {
      const [agenda, rq] = await Promise.all([store.listAgenda(), store.listRequests()]);
      setItems(agenda);
      setRequests(rq);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible.");
    } finally {
      setLoaded(true);
    }
  }, [store]);

  useEffect(() => {
    load();
    // Rafraîchit quand l'application revient au premier plan (nouvelles demandes).
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const goto = (v: View) => {
    setView(v);
    window.history.pushState(null, "", v === "agenda" ? "/admin" : `/admin?vue=${v}`);
    window.scrollTo({ top: 0 });
  };

  const newRequests = requests.filter((r) => r.status === "nouvelle").length;
  const urgent = requests.filter((r) => r.status === "nouvelle" && r.urgency === "tres_urgente").length;
  const month = todayISO().slice(0, 7);
  const inProgress = items.filter((i) => i.intervention && ["en_cours", "attente_materiel"].includes(i.intervention.status)).length;
  const doneThisMonth = items.filter((i) => i.intervention?.status === "terminee" && i.date.startsWith(month)).length;

  const save = async (input: SlotInput) => {
    await store.saveSlot(input);
    setEditing(null);
    setToast(input.kind === "blocage" ? "Créneau bloqué" : input.slotId ? "Intervention modifiée" : "Intervention ajoutée");
    await load();
  };

  const remove = async (slotId: string) => {
    const item = items.find((i) => i.id === slotId);
    await store.deleteSlot(slotId);
    // Une intervention retirée de l'agenda redevient « à planifier » (elle reste dans l'historique du client).
    if (item?.intervention && !items.some((i) => i.id !== slotId && i.intervention?.id === item.intervention?.id)) {
      await store.setInterventionStatus(item.intervention.id, "a_planifier");
    }
    setEditing(null);
    setToast(item?.kind === "blocage" ? "Créneau supprimé" : "Intervention retirée de l'agenda");
    await load();
  };

  const setStatus = async (id: string, status: RequestStatus) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await store.setRequestStatus(id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
      load();
    }
  };

  const schedule = (r: RequestItem) =>
    setEditing({
      ...emptySlot(todayISO()),
      requestId: r.id,
      clientId: r.clientId ?? undefined,
      service: r.service ?? (r.kind === "depannage" ? "depannage" : ""),
      title: r.kind === "depannage" ? `Dépannage – ${r.failureNature ?? ""}`.trim() : "",
      description: r.description,
      clientType: r.clientType ?? "particulier",
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      email: r.email,
      addressLine: r.addressLine,
      postalCode: r.postalCode,
      city: r.city,
    });

  const signOut = async () => {
    await store.signOut();
    window.location.href = "/admin/connexion";
  };

  const tabs: { key: View; label: string; badge?: number }[] = [
    { key: "agenda", label: "Agenda" },
    { key: "demandes", label: "Demandes", badge: newRequests },
    { key: "statistiques", label: "Statistiques" },
  ];

  const summary = [
    { label: "Nouvelles demandes", value: newRequests, alert: false, go: "demandes" as View },
    { label: "Dépannages urgents", value: urgent, alert: urgent > 0, go: "demandes" as View },
    { label: "En cours", value: inProgress, alert: false, go: null },
    { label: "Terminées ce mois", value: doneThisMonth, alert: false, go: null },
  ];

  return (
    <div className="min-h-svh bg-fond pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b border-ligne bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-4 px-4 md:h-17 md:px-8">
          <div className="flex items-center gap-3">
            <Image src="/images/logo-ampoule.png" alt="Électricité N.A.B." width={40} height={38} className="h-10 w-auto" />
            <span className="font-titre text-2xl leading-none font-bold text-nuit">{view === "comptes" ? "Comptes" : tabs.find((t) => t.key === view)?.label}</span>
          </div>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => goto(t.key)}
                aria-current={view === t.key ? "page" : undefined}
                className={`relative min-h-10 rounded-full px-4 text-sm ${view === t.key ? "bg-nuit text-white" : "text-nuit hover:bg-fond"}`}
              >
                {t.label}
                {t.badge ? <span className="ml-2 rounded-full bg-rouge px-1.5 text-xs text-white">{t.badge}</span> : null}
              </button>
            ))}
            <a href="/" className="ml-3 text-sm text-discret underline underline-offset-4">Voir le site</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(emptySlot(todayISO()))}
              className="hidden min-h-10 rounded-full bg-nuit px-5 text-sm text-white md:inline-flex md:items-center"
            >
              + Nouvelle intervention
            </button>
            <button
              type="button"
              onClick={() => goto("comptes")}
              aria-current={view === "comptes" ? "page" : undefined}
              className={`min-h-10 text-sm underline-offset-4 ${view === "comptes" ? "font-semibold text-nuit underline" : "text-discret underline"}`}
            >
              Comptes
            </button>
            <button type="button" onClick={signOut} className="min-h-10 text-sm text-discret underline underline-offset-4" title={email}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 md:px-8 md:pt-8">
        {error ? (
          <p role="alert" className="mb-4 rounded-lg border border-rouge/30 bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">
            {error}
          </p>
        ) : null}

        {!loaded ? (
          <p className="py-10 text-center text-discret" aria-busy="true">Chargement…</p>
        ) : view === "agenda" ? (
          <>
            <AgendaView
              items={items}
              onOpen={(i) => setEditing(toInput(i))}
              onAdd={(date) => setEditing(emptySlot(date))}
              onBlock={(date) => setEditing(emptySlot(date, "blocage"))}
            />
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {summary.map((s) => {
                const cls = `rounded-xl border p-4 text-left ${s.alert ? "border-rouge bg-rouge text-white" : "border-ligne bg-white text-nuit"}`;
                const content = (
                  <>
                    <span className={`block text-[0.7rem] tracking-widest uppercase ${s.alert ? "text-white/85" : "text-discret"}`}>{s.label}</span>
                    <span className="mt-1 block font-titre text-3xl font-bold tabular-nums">{s.value}</span>
                  </>
                );
                return s.go ? (
                  <button key={s.label} type="button" onClick={() => goto(s.go as View)} className={cls}>
                    {content}
                  </button>
                ) : (
                  <div key={s.label} className={cls}>
                    {content}
                  </div>
                );
              })}
            </div>
          </>
        ) : view === "demandes" ? (
          <RequestsView requests={requests} onStatus={setStatus} onSchedule={schedule} />
        ) : view === "comptes" ? (
          <AccountsView onToast={setToast} />
        ) : (
          <StatsView store={store} requests={requests} />
        )}
      </main>

      {view === "agenda" ? (
        <button
          type="button"
          onClick={() => setEditing(emptySlot(todayISO()))}
          aria-label="Nouvelle intervention"
          className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full bg-nuit text-3xl leading-none text-white shadow-lg md:hidden"
        >
          +
        </button>
      ) : null}

      <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 border-t border-ligne bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <ul className="grid grid-cols-4">
          {tabs.map((t) => (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => goto(t.key)}
                aria-current={view === t.key ? "page" : undefined}
                className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.8rem] ${view === t.key ? "text-nuit" : "text-discret"}`}
              >
                <span className={`h-0.5 w-6 rounded-full ${view === t.key ? "bg-nuit" : "bg-transparent"}`} />
                {t.label}
                {t.badge ? (
                  <span className="absolute top-2.5 left-[58%] rounded-full bg-rouge px-1.5 text-[0.65rem] text-white">{t.badge}</span>
                ) : null}
              </button>
            </li>
          ))}
          <li>
            <a href="/" className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.8rem] text-discret">
              <span className="h-0.5 w-6" />
              Le site
            </a>
          </li>
        </ul>
      </nav>

      <SlotSheet initial={editing} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />

      {toast ? (
        <p role="status" className="fixed inset-x-0 bottom-24 z-[60] mx-auto w-fit rounded-full bg-nuit px-5 py-2.5 text-sm text-white shadow-lg md:bottom-8">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
