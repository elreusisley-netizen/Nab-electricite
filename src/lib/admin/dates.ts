// Dates de l'admin, en heure locale de l'appareil (France).

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromISO = (iso: string) => new Date(`${iso}T12:00:00`);

export const todayISO = () => toISO(new Date());

export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Date « AAAA-MM-JJ » + heure « HH:MM » locales → horodatage ISO (UTC) pour la base. */
export const toTimestamp = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", opts);

export const longDate = (iso: string) => fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(fromISO(iso));
export const dayMonth = (iso: string) => fmt({ weekday: "long", day: "numeric", month: "long" }).format(fromISO(iso));
export const monthYear = (d: Date) => fmt({ month: "long", year: "numeric" }).format(d);
export const weekdayShort = (iso: string) => fmt({ weekday: "short" }).format(fromISO(iso)).replace(".", "");

export const timeRange = (start: string | null, end: string | null) =>
  start && end ? `${start.replace(":", "h")} – ${end.replace(":", "h")}` : start ? `à partir de ${start.replace(":", "h")}` : null;

/** « Aujourd'hui », « Demain », « Dans 5 jours », « Dans 3 semaines », « Dans 4 mois » */
export function delayLabel(iso: string, today: string): string {
  const days = Math.round((fromISO(iso).getTime() - fromISO(today).getTime()) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  if (days < 14) return `Dans ${days} jours`;
  if (days < 60) return `Dans ${Math.round(days / 7)} semaines`;
  return `Dans ${Math.round(days / 30.4)} mois`;
}

/** « il y a 3 h », « hier », « il y a 4 jours » pour les demandes reçues */
export function receivedLabel(ts: string): string {
  const diffH = (Date.now() - new Date(ts).getTime()) / 3_600_000;
  if (diffH < 1) return "il y a moins d'une heure";
  if (diffH < 24) return `il y a ${Math.round(diffH)} h`;
  const days = Math.round(diffH / 24);
  return days === 1 ? "hier" : `il y a ${days} jours`;
}
