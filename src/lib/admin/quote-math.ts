// Calcul des totaux d'un devis, identique à la fonction recompute_quote_totals de la base.
// Montants en centimes.

export type MathLine = {
  lineType: string;
  quantity: number;
  unitPriceCents: number;
  discountPct: number;
  taxRate: number | null;
};

export const lineTotalCents = (l: MathLine) =>
  l.lineType === "texte" ? 0 : Math.round(l.quantity * l.unitPriceCents * (1 - l.discountPct / 100));

export function quoteTotals(lines: MathLine[], globalDiscountPct: number) {
  const subtotal = lines.reduce((s, l) => s + lineTotalCents(l), 0);
  const byRate = new Map<number, number>();
  for (const l of lines) {
    if (l.lineType === "texte" || l.taxRate === null) continue;
    byRate.set(l.taxRate, (byRate.get(l.taxRate) ?? 0) + lineTotalCents(l));
  }
  let ht = 0;
  let tva = 0;
  const vatBreakdown: { rate: number; baseCents: number; vatCents: number }[] = [];
  for (const [rate, base] of [...byRate.entries()].sort((a, b) => b[0] - a[0])) {
    const baseAfter = Math.round(base * (1 - globalDiscountPct / 100));
    const vat = Math.round((baseAfter * rate) / 100);
    ht += baseAfter;
    tva += vat;
    vatBreakdown.push({ rate, baseCents: baseAfter, vatCents: vat });
  }
  return { subtotalCents: subtotal, discountCents: subtotal - ht, htCents: ht, tvaCents: tva, ttcCents: ht + tva, vatBreakdown };
}

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const formatEuros = (cents: number) => eur.format(cents / 100);

/** « 12,50 » ou « 12.5 » → 1250 centimes ; vide ou invalide → 0 */
export function parseEurosToCents(value: string): number {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export function parseDecimal(value: string): number {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
