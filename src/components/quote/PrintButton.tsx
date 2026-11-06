"use client";

export function PrintButton({ label = "Imprimer / enregistrer en PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="min-h-11 rounded-full border border-nuit bg-white px-5 text-sm text-nuit print:hidden">
      {label}
    </button>
  );
}
