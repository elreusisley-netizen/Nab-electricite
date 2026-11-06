"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icons";

export const fieldClass =
  "mt-1.5 w-full rounded-lg border border-ligne bg-white px-3 py-2.5 text-base text-encre focus:border-nuit focus:outline-none disabled:bg-fond disabled:text-discret";
export const labelClass = "block text-[0.7rem] font-semibold tracking-widest text-discret uppercase";

/** Panneau : monte du bas sur mobile, s'ouvre à droite sur ordinateur. */
export function Panel({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-nuit/40" onClick={onClose} aria-hidden />
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-[94svh] flex-col rounded-t-2xl bg-white shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:rounded-none ${
          wide ? "md:w-[46rem]" : "md:w-[32rem]"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ligne px-5 pt-5 pb-4 md:px-7">
          <div className="min-w-0">
            <h2 className="font-titre text-3xl font-bold text-nuit">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-discret">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-11 shrink-0 place-items-center text-nuit">
            <Icon name="close" size={22} strokeWidth={2} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ligne px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-7">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">
      {message}
    </p>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { key: T; label: string; badge?: number }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex overflow-x-auto rounded-full border border-ligne bg-white p-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={`flex min-h-10 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap ${
            value === o.key ? "bg-nuit text-white" : "text-nuit"
          }`}
        >
          {o.label}
          {o.badge ? <span className="rounded-full bg-rouge px-1.5 text-xs text-white">{o.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}
