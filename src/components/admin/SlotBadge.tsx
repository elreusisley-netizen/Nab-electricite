import { INTERVENTION_STATUS, type AgendaItem, type InterventionStatus } from "@/lib/admin/types";

const styles: Record<InterventionStatus, string> = {
  a_planifier: "border border-dashed border-nuit/50 text-nuit",
  planifiee: "bg-nuit text-white",
  en_cours: "bg-rouge text-white",
  attente_materiel: "border border-rouge text-rouge-fonce",
  terminee: "border border-ligne text-discret",
  annulee: "border border-ligne text-discret line-through",
};

export function SlotBadge({ item }: { item: AgendaItem }) {
  if (item.kind === "blocage") {
    return <span className="inline-flex rounded-full bg-fond px-2.5 py-0.5 text-[0.7rem] whitespace-nowrap text-discret">Indisponible</span>;
  }
  const status = item.intervention?.status ?? "planifiee";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] whitespace-nowrap ${styles[status]}`}>
      {INTERVENTION_STATUS[status]}
    </span>
  );
}

/** Pastille de la grille du mois */
export function dotClass(item: AgendaItem) {
  if (item.kind === "blocage") return "bg-discret/50";
  const s = item.intervention?.status;
  if (s === "annulee") return "hidden";
  if (s === "terminee") return "bg-discret/60";
  if (s === "en_cours" || s === "attente_materiel") return "bg-rouge";
  return "bg-nuit";
}
