"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { dayMonth, delayLabel, todayISO } from "@/lib/admin/dates";
import { clientName } from "@/lib/admin/store";
import { ACTIVE_STATUSES, type AgendaItem } from "@/lib/admin/types";
import { allServices } from "@/lib/labels";

/** Pagination compacte : au-delà de ce nombre de points, fenêtre glissante. */
const MAX_DOTS = 7;

const remainingLabel = (n: number) =>
  n === 0 ? "Aucune autre intervention à venir" : `${n} intervention${n > 1 ? "s" : ""} à venir`;

/** Toutes les interventions planifiées à venir, accessibles par swipe, sans limite. */
export function NextInterventionsCarousel({ items, onOpen }: { items: AgendaItem[]; onOpen: (i: AgendaItem) => void }) {
  const today = todayISO();
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const upcoming = useMemo(
    () =>
      items
        .filter((i) => i.kind === "intervention" && i.intervention && ACTIVE_STATUSES.includes(i.intervention.status) && i.date >= today)
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [items, today],
  );
  const count = upcoming.length;

  useEffect(() => {
    if (index > count - 1) setIndex(Math.max(0, count - 1));
  }, [count, index]);

  const cardStep = () => {
    const el = scroller.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return 1;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    return first.offsetWidth + gap;
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / cardStep()))));
  };

  const goTo = useCallback(
    (i: number) => {
      const el = scroller.current;
      if (!el) return;
      const target = Math.min(count - 1, Math.max(0, i));
      el.scrollTo({ left: target * cardStep(), behavior: "smooth" });
      setIndex(target);
    },
    [count],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  if (!count) {
    return (
      <section aria-label="Prochaines interventions" className="rounded-xl bg-nuit px-5 py-6 text-white md:px-7">
        <p className="text-[0.65rem] tracking-[0.3em] uppercase opacity-70">Prochaine intervention</p>
        <p className="mt-2 font-titre text-2xl leading-tight font-bold">Aucune intervention planifiée pour le moment</p>
      </section>
    );
  }

  const dotCount = Math.min(MAX_DOTS, count);
  const dotStart = Math.min(Math.max(0, index - Math.floor(MAX_DOTS / 2)), count - dotCount);
  const dots = Array.from({ length: dotCount }, (_, k) => dotStart + k);

  return (
    <section aria-roledescription="carrousel" aria-label="Prochaines interventions planifiées">
      <div
        ref={scroller}
        onScroll={onScroll}
        onKeyDown={onKey}
        tabIndex={0}
        aria-label="Faites glisser pour voir les interventions suivantes"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] focus-visible:outline-none md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {upcoming.map((it, i) => {
          const iv = it.intervention!;
          return (
            <button
              key={it.id}
              type="button"
              aria-label={`Intervention ${i + 1} sur ${count} : ${dayMonth(it.date)}, ${iv.title}. Ouvrir la fiche`}
              onClick={() => onOpen(it)}
              tabIndex={-1}
              className={`w-[calc(100%-2.75rem)] shrink-0 snap-start rounded-xl bg-nuit px-5 py-5 text-left text-white transition-opacity duration-300 md:w-[min(34rem,calc(100%-6rem))] md:px-7 ${
                i === index ? "opacity-100" : "opacity-60"
              }`}
            >
              <span className="block text-[0.65rem] tracking-[0.3em] uppercase opacity-70">Prochaine intervention</span>
              <span className="mt-2 block font-titre text-[1.7rem] leading-tight font-bold first-letter:uppercase">
                {dayMonth(it.date)}
              </span>
              <span className="mt-1 block truncate text-sm opacity-85">
                {delayLabel(it.date, today)} · {it.start.replace(":", "h")} · {allServices[iv.service]}
              </span>
              <span className="mt-1 block truncate text-sm opacity-85">
                {clientName(iv.client)}
                {iv.site ? ` · ${iv.site.city}` : ""}
              </span>
              <span className="mt-4 block border-t border-white/20 pt-3 text-sm opacity-85">{remainingLabel(count - i - 1)}</span>
            </button>
          );
        })}
        <span aria-hidden className="w-[1.75rem] shrink-0 md:w-[calc(100%-min(34rem,calc(100%-6rem))-0.75rem)]" />
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Intervention précédente"
            className="hidden size-9 place-items-center rounded-full border border-ligne bg-white disabled:opacity-30 md:grid"
          >
            <span className="inline-block rotate-90">
              <Icon name="chevron" size={16} strokeWidth={2} />
            </span>
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choisir une intervention">
            {dots.map((d) => {
              const edge = count > MAX_DOTS && ((d === dotStart && d > 0) || (d === dotStart + dotCount - 1 && d < count - 1));
              return (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={d === index}
                  aria-label={`Intervention ${d + 1} sur ${count}`}
                  onClick={() => goTo(d)}
                  className="grid size-5 place-items-center"
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      d === index ? "size-2 bg-nuit" : edge ? "size-1 bg-discret/40" : "size-1.5 bg-discret/40"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {count > MAX_DOTS ? (
            <span className="text-xs text-discret tabular-nums" aria-live="polite">
              {index + 1} / {count}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === count - 1}
            aria-label="Intervention suivante"
            className="hidden size-9 place-items-center rounded-full border border-ligne bg-white disabled:opacity-30 md:grid"
          >
            <span className="inline-block -rotate-90">
              <Icon name="chevron" size={16} strokeWidth={2} />
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
