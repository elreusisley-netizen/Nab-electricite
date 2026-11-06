import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { allServices, formatDateTime, urgencyLevels, type RequestStatus, type UrgencyLevel } from "@/lib/labels";

type Row = {
  id: string;
  kind: "devis" | "depannage";
  status: RequestStatus;
  first_name: string;
  last_name: string;
  city: string;
  service: keyof typeof allServices | null;
  failure_nature: string | null;
  urgency: UrgencyLevel | null;
  received_at: string;
};

const tabs = [
  { key: "devis", label: "Devis" },
  { key: "depannage", label: "Dépannages" },
] as const;

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ type?: string; voir?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const kind = params.type === "depannage" ? "depannage" : "devis";
  const showClosed = params.voir === "tout";

  let query = supabase
    .from("requests")
    .select("id, kind, status, first_name, last_name, city, service, failure_nature, urgency, received_at")
    .eq("kind", kind)
    .order("received_at", { ascending: false })
    .limit(200);
  if (!showClosed) query = query.not("status", "in", "(sans_suite,archivee)");
  const { data, error } = await query;
  const rows = (data ?? []) as Row[];

  const counts = await Promise.all(
    tabs.map(async (t) => {
      const { count } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("kind", t.key)
        .eq("status", "nouvelle");
      return count ?? 0;
    }),
  );

  return (
    <>
      <AdminHeader current="demandes" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-titre text-3xl font-bold text-nuit">Demandes</h1>

        <div className="mt-6 flex gap-2" role="tablist">
          {tabs.map((t, i) => (
            <Link
              key={t.key}
              role="tab"
              aria-selected={kind === t.key}
              href={`/admin/demandes?type=${t.key}${showClosed ? "&voir=tout" : ""}`}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold ${kind === t.key ? "bg-nuit text-white" : "bg-white text-nuit"}`}
            >
              {t.label}
              {counts[i] > 0 ? <span className="rounded-full bg-rouge px-2 text-xs text-white">{counts[i]}</span> : null}
            </Link>
          ))}
        </div>

        <p className="mt-4 text-sm text-discret">
          {showClosed ? (
            <Link href={`/admin/demandes?type=${kind}`} className="underline">Masquer les demandes sans suite et archivées</Link>
          ) : (
            <Link href={`/admin/demandes?type=${kind}&voir=tout`} className="underline">Afficher aussi les demandes sans suite et archivées</Link>
          )}
        </p>

        {error ? <p className="mt-6 text-rouge-fonce">Impossible de charger les demandes.</p> : null}

        {rows.length === 0 && !error ? (
          <p className="mt-10 rounded-xl border border-ligne bg-white p-8 text-center text-discret">
            Aucune demande {kind === "devis" ? "de devis" : "de dépannage"} pour le moment.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/demandes/${r.id}`}
                  className={`block rounded-xl border bg-white p-5 hover:border-nuit ${r.urgency === "tres_urgente" && r.status === "nouvelle" ? "border-rouge" : "border-ligne"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-titre text-xl font-bold text-nuit">
                      {r.first_name} {r.last_name}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-texte">
                    {r.kind === "devis" ? (r.service ? allServices[r.service] : "") : r.failure_nature} · {r.city}
                  </p>
                  <p className="mt-1 text-sm text-discret">
                    Reçue le {formatDateTime(r.received_at)}
                    {r.urgency ? (
                      <span className={r.urgency === "tres_urgente" ? "font-semibold text-rouge-fonce" : ""}> · {urgencyLevels[r.urgency]}</span>
                    ) : null}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
