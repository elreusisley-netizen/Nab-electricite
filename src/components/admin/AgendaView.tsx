"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { dayMonth, fromISO, monthYear, timeRange, toISO, todayISO, weekdayShort } from "@/lib/admin/dates";
import { clientName } from "@/lib/admin/store";
import type { AgendaItem } from "@/lib/admin/types";
import { allServices } from "@/lib/labels";
import { NextInterventionsCarousel } from "./NextInterventionsCarousel";
import { SlotBadge, dotClass } from "./SlotBadge";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Une ligne de l'agenda (liste et détail du jour) */
function SlotRow({ item, onOpen, showDate }: { item: AgendaItem; onOpen: () => void; showDate?: boolean }) {
  const iv = item.intervention;
  const cancelled = iv?.status === "annulee";
  const phone = iv?.client.phone;
  return (
    <li className="flex gap-4 border-b border-ligne py-4">
      {showDate ? (
        <div className="w-12 shrink-0 text-center">
          <p className="text-[0.65rem] tracking-widest text-discret uppercase">{weekdayShort(item.date)}</p>
          <p className="font-titre text-3xl leading-none font-bold text-nuit">{fromISO(item.date).getDate()}</p>
        </div>
      ) : null}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`font-titre text-xl leading-tight font-bold ${cancelled ? "text-discret line-through" : "text-nuit"}`}>
            {item.kind === "blocage" ? item.note || "Indisponible" : iv?.title}
          </span>
          <SlotBadge item={item} />
        </span>
        <span className="mt-1 block text-sm text-discret">
          {[timeRange(item.start, item.end), iv ? allServices[iv.service] : null, iv ? clientName(iv.client) : null, iv?.site?.city]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </button>
      {phone ? (
        <a
          href={telHref(phone)}
          aria-label={`Appeler ${iv ? clientName(iv.client) : "le client"}`}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-ligne text-nuit"
        >
          <Icon name="phone" size={18} strokeWidth={2} />
        </a>
      ) : null}
    </li>
  );
}

interface Props {
  items: AgendaItem[];
  onOpen: (i: AgendaItem) => void;
  onAdd: (date: string) => void;
  onBlock: (date: string) => void;
}

export function AgendaView({ items, onOpen, onAdd, onBlock }: Props) {
  const today = todayISO();
  const [mode, setMode] = useState<"mois" | "liste">("mois");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [showPast, setShowPast] = useState(false);

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const i of items) map.set(i.date, [...(map.get(i.date) ?? []), i]);
    return map;
  }, [items]);

  const monthPrefix = toISO(cursor).slice(0, 7);
  const monthCount = items.filter(
    (i) => i.kind === "intervention" && i.intervention?.status !== "annulee" && i.date.startsWith(monthPrefix),
  ).length;

  const firstWeekday = (cursor.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))),
  ];
  const move = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const groups = useMemo(() => {
    const list = showPast ? items : items.filter((i) => i.date >= today);
    const g = new Map<string, AgendaItem[]>();
    for (const i of list) g.set(i.date.slice(0, 7), [...(g.get(i.date.slice(0, 7)) ?? []), i]);
    return [...g.entries()];
  }, [items, showPast, today]);

  const dayItems = byDate.get(selected) ?? [];

  return (
    <div>
      <NextInterventionsCarousel items={items} onOpen={onOpen} />

      <div className="mt-6 flex items-center justify-between md:mt-8">
        <div role="tablist" aria-label="Affichage" className="flex rounded-full border border-ligne bg-white p-1">
          {(["mois", "liste"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-10 rounded-full px-5 text-sm capitalize ${mode === m ? "bg-nuit text-white" : "text-nuit"}`}
            >
              {m}
            </button>
          ))}
        </div>
        {mode === "mois" ? (
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
              setSelected(today);
            }}
            className="min-h-10 text-sm text-nuit underline underline-offset-4"
          >
            Aujourd&apos;hui
          </button>
        ) : null}
      </div>

      {mode === "mois" ? (
        <div className="mt-4 md:grid md:grid-cols-[1.25fr_1fr] md:gap-8">
          <section className="rounded-xl border border-ligne bg-white p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => move(-1)} aria-label="Mois précédent" className="grid size-11 place-items-center text-nuit">
                <span className="inline-block rotate-90">
                  <Icon name="chevron" size={22} strokeWidth={1.8} />
                </span>
              </button>
              <div className="text-center">
                <p className="font-titre text-2xl font-bold text-nuit capitalize">{monthYear(cursor)}</p>
                <p className="text-xs text-discret">
                  {monthCount} intervention{monthCount > 1 ? "s" : ""}
                </p>
              </div>
              <button type="button" onClick={() => move(1)} aria-label="Mois suivant" className="grid size-11 place-items-center text-nuit">
                <span className="inline-block -rotate-90">
                  <Icon name="chevron" size={22} strokeWidth={1.8} />
                </span>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 text-center">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1 text-[0.7rem] text-discret">
                  {w}
                </span>
              ))}
              {cells.map((iso, i) => {
                if (!iso) return <span key={`e${i}`} />;
                const list = byDate.get(iso) ?? [];
                const isSel = iso === selected;
                const isToday = iso === today;
                const busy = list.some((x) => x.kind === "blocage" || x.intervention?.status !== "annulee");
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelected(iso)}
                    aria-pressed={isSel}
                    aria-label={`${dayMonth(iso)}${list.length ? `, ${list.length} élément${list.length > 1 ? "s" : ""}` : ""}`}
                    className={`relative mx-auto my-0.5 flex aspect-square w-full max-w-12 flex-col items-center justify-center rounded-lg text-[0.95rem] transition-colors ${
                      isSel ? "bg-nuit text-white" : busy ? "bg-fond" : "hover:bg-fond"
                    } ${iso < today && !isSel ? "text-discret/70" : ""}`}
                  >
                    <span className={isToday && !isSel ? "underline decoration-2 underline-offset-4" : ""}>{fromISO(iso).getDate()}</span>
                    <span className="mt-1 flex h-1.5 gap-0.5">
                      {list.slice(0, 3).map((x) => (
                        <span key={x.id} className={`size-1.5 rounded-full ${isSel ? "bg-white" : dotClass(x)}`} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-6 md:mt-0" aria-live="polite">
            <div className="flex items-baseline justify-between gap-3 border-b border-ligne pb-3">
              <h2 className="font-titre text-2xl font-bold text-nuit first-letter:uppercase">{dayMonth(selected)}</h2>
              <span className="flex shrink-0 gap-4 text-sm">
                <button type="button" onClick={() => onBlock(selected)} className="min-h-10 text-discret underline underline-offset-4">
                  Bloquer
                </button>
                <button type="button" onClick={() => onAdd(selected)} className="min-h-10 text-nuit underline underline-offset-4">
                  + Ajouter
                </button>
              </span>
            </div>
            {dayItems.length ? (
              <ul>
                {dayItems.map((x) => (
                  <SlotRow key={x.id} item={x} onOpen={() => onOpen(x)} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-discret">Journée libre. Ajoutez une intervention ou bloquez la journée.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-4">
          {groups.length ? (
            groups.map(([key, list]) => (
              <section key={key} className="mb-6">
                <h2 className="sticky top-[3.75rem] z-10 bg-fond py-2 text-xs tracking-widest text-discret uppercase md:top-[4.25rem]">
                  {monthYear(fromISO(`${key}-01`))}
                </h2>
                <ul className="border-t border-ligne">
                  {list.map((x) => (
                    <SlotRow key={x.id} item={x} onOpen={() => onOpen(x)} showDate />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <p className="py-6 text-discret">Aucune intervention à venir.</p>
          )}
          <button type="button" onClick={() => setShowPast(!showPast)} className="min-h-10 text-sm text-nuit underline underline-offset-4">
            {showPast ? "Masquer les dates passées" : "Afficher aussi les dates passées"}
          </button>
        </div>
      )}
    </div>
  );
}
