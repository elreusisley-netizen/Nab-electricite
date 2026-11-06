import { requestStatuses, type RequestStatus } from "@/lib/labels";

const styles: Record<RequestStatus, string> = {
  nouvelle: "bg-rouge text-white",
  en_cours: "bg-nuit text-white",
  devis_cree: "bg-nuit-clair text-white",
  planifiee: "bg-nuit-clair text-white",
  sans_suite: "bg-ligne text-discret",
  archivee: "bg-ligne text-discret",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {requestStatuses[status]}
    </span>
  );
}
