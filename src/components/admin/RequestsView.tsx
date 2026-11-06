"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { receivedLabel } from "@/lib/admin/dates";
import type { RequestItem } from "@/lib/admin/types";
import { allServices, buildingTypes, clientTypes, requestStatuses, urgencyLevels, type RequestStatus } from "@/lib/labels";
import { StatusBadge } from "./StatusBadge";

interface Props {
  requests: RequestItem[];
  onStatus: (id: string, status: RequestStatus) => void;
  onSchedule: (r: RequestItem) => void;
  onQuote: (r: RequestItem) => void;
}

const CLOSED: RequestStatus[] = ["sans_suite", "archivee"];

export function RequestsView({ requests, onStatus, onSchedule, onQuote }: Props) {
  const [kind, setKind] = useState<"devis" | "depannage">("devis");
  const [showClosed, setShowClosed] = useState(false);

  const counts = {
    devis: requests.filter((r) => r.kind === "devis" && r.status === "nouvelle").length,
    depannage: requests.filter((r) => r.kind === "depannage" && r.status === "nouvelle").length,
  };
  const list = requests.filter((r) => r.kind === kind && (showClosed || !CLOSED.includes(r.status)));

  return (
    <div>
      <div role="tablist" aria-label="Type de demande" className="flex rounded-full border border-ligne bg-white p-1">
        {(["devis", "depannage"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm ${kind === k ? "bg-nuit text-white" : "text-nuit"}`}
          >
            {k === "devis" ? "Devis" : "Dépannages"}
            {counts[k] > 0 ? <span className="rounded-full bg-rouge px-1.5 text-xs text-white">{counts[k]}</span> : null}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-8 rounded-xl border border-ligne bg-white p-8 text-center text-discret">
          Aucune demande {kind === "devis" ? "de devis" : "de dépannage"} {showClosed ? "" : "en cours"}.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map((r) => {
            const urgent = r.urgency === "tres_urgente" && r.status === "nouvelle";
            return (
              <li key={r.id} className={`rounded-xl border bg-white p-5 ${urgent ? "border-rouge" : "border-ligne"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-titre text-xl font-bold text-nuit">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-sm text-discret">
                      {r.kind === "devis"
                        ? [r.service ? allServices[r.service] : null, r.buildingType ? buildingTypes[r.buildingType] : null, r.clientType ? clientTypes[r.clientType] : null]
                            .filter(Boolean)
                            .join(" · ")
                        : r.failureNature}
                      {" · "}
                      {r.city}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.urgency ? (
                  <p className={`mt-2 text-sm ${r.urgency === "tres_urgente" ? "font-semibold text-rouge-fonce" : "text-texte"}`}>
                    {urgencyLevels[r.urgency]}
                  </p>
                ) : null}
                <p className="mt-2 line-clamp-3 text-texte">{r.description}</p>
                <p className="mt-2 text-xs text-discret">Reçue {receivedLabel(r.receivedAt)}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rouge text-sm font-semibold text-white">
                    <Icon name="phone" size={16} strokeWidth={2} /> Appeler
                  </a>
                  <button type="button" onClick={() => onSchedule(r)} className="flex min-h-11 items-center justify-center rounded-lg bg-nuit text-sm font-semibold text-white">
                    Planifier
                  </button>
                  {r.kind === "devis" ? (
                    <button type="button" onClick={() => onQuote(r)} className="flex min-h-11 items-center justify-center rounded-lg border border-nuit text-sm font-semibold text-nuit">
                      Créer le devis
                    </button>
                  ) : null}
                  <Link href={`/admin/demandes/${r.id}`} className="flex min-h-11 items-center justify-center rounded-lg border border-ligne text-sm font-semibold text-nuit">
                    Fiche et photos
                  </Link>
                  <label className="sr-only" htmlFor={`st-${r.id}`}>Statut</label>
                  <select
                    id={`st-${r.id}`}
                    value={r.status}
                    onChange={(e) => onStatus(r.id, e.target.value as RequestStatus)}
                    className="min-h-11 rounded-lg border border-ligne bg-white px-2 text-sm text-nuit"
                  >
                    {(Object.entries(requestStatuses) as [RequestStatus, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" onClick={() => setShowClosed(!showClosed)} className="mt-5 min-h-10 text-sm text-nuit underline underline-offset-4">
        {showClosed ? "Masquer les demandes sans suite et archivées" : "Afficher aussi les demandes sans suite et archivées"}
      </button>
    </div>
  );
}
