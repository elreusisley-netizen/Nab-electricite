"use client";

import { useEffect, useMemo } from "react";
import { MAX_PHOTOS } from "@/lib/requests-schema";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-rouge-fonce">{message}</p>;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium text-encre">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`mt-1 block min-h-12 w-full rounded-lg border bg-white px-3 text-base ${error ? "border-rouge" : "border-ligne"}`}
      />
      <FieldError message={error} />
    </div>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium text-encre">
        {label}
      </label>
      {hint ? <p className="text-sm text-discret">{hint}</p> : null}
      <textarea
        id={id}
        name={id}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-base ${error ? "border-rouge" : "border-ligne"}`}
      />
      <FieldError message={error} />
    </div>
  );
}

// Choix sous forme de grandes cartes, faciles à toucher sur téléphone.
export function ChoiceGrid<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  columns = 2,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
  error?: string;
  columns?: 1 | 2 | 3;
}) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3" }[columns];
  return (
    <fieldset>
      <legend className="font-titre text-2xl font-bold text-nuit">{legend}</legend>
      <div className={`mt-4 grid gap-3 ${cols}`}>
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex min-h-14 cursor-pointer items-center rounded-lg border-2 px-4 py-3 font-semibold transition ${
              value === o.value ? "border-nuit bg-nuit text-white" : "border-ligne bg-white text-nuit hover:border-nuit"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

export function PhotoPicker({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  return (
    <div>
      <p className="font-medium text-encre">Photos (facultatif, {MAX_PHOTOS} maximum)</p>
      <p className="text-sm text-discret">Tableau électrique, panne, pièce concernée… Les photos aident à préparer l'intervention.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {previews.map((p, i) => (
          <div key={p.url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-ligne">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              aria-label={`Retirer la photo ${i + 1}`}
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-nuit/80 text-lg text-white"
            >
              ×
            </button>
          </div>
        ))}
        {files.length < MAX_PHOTOS ? (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ligne text-center text-sm text-discret hover:border-nuit">
            <span className="text-2xl">+</span>
            Ajouter
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
                onChange([...files, ...picked].slice(0, MAX_PHOTOS));
                e.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}

export function ConsentField({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-5 w-5 flex-none accent-nuit"
        />
        <span className="text-sm text-texte">
          J'accepte que mes informations soient utilisées pour traiter ma demande, conformément à la{" "}
          <a href="/politique-de-confidentialite" target="_blank" className="underline">
            politique de confidentialité
          </a>
          .
        </span>
      </label>
      <FieldError message={error} />
    </div>
  );
}

// Champ piège : invisible pour les visiteurs, rempli par les robots.
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
      <label htmlFor="website">Ne pas remplir</label>
      <input id="website" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
