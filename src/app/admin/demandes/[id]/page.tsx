import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Icon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import {
  allServices,
  buildingTypes,
  clientTypes,
  formatDateTime,
  requestStatuses,
  urgencyLevels,
  type BuildingType,
  type ClientType,
  type RequestStatus,
  type UrgencyLevel,
} from "@/lib/labels";
import { updateRequestStatus } from "../actions";

type RequestDetail = {
  id: string;
  kind: "devis" | "depannage";
  status: RequestStatus;
  client_type: ClientType | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line: string;
  postal_code: string;
  city: string;
  building_type: BuildingType | null;
  service: keyof typeof allServices | null;
  failure_nature: string | null;
  urgency: UrgencyLevel | null;
  description: string;
  received_at: string;
};

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const r = data as RequestDetail;

  const { data: fileRows } = await supabase
    .from("files")
    .select("bucket, path")
    .eq("request_id", id)
    .order("created_at", { ascending: true });
  const paths = ((fileRows ?? []) as { bucket: string; path: string }[]).map((f) => f.path);
  let photos: { signedUrl: string; path: string }[] = [];
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("request-photos").createSignedUrls(paths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) photos.push({ signedUrl: s.signedUrl, path: s.path });
    }
  }

  const address = `${r.address_line}, ${r.postal_code} ${r.city}`;
  const phoneHref = `tel:${r.phone.replace(/[^\d+]/g, "")}`;

  const details: [string, string][] = [
    ...(r.kind === "devis"
      ? ([
          ["Client", r.client_type ? clientTypes[r.client_type] : "—"],
          ["Bâtiment", r.building_type ? buildingTypes[r.building_type] : "—"],
          ["Prestation", r.service ? allServices[r.service] : "—"],
        ] as [string, string][])
      : ([
          ["Panne", r.failure_nature ?? "—"],
          ["Urgence", r.urgency ? urgencyLevels[r.urgency] : "—"],
        ] as [string, string][])),
    ["Reçue le", formatDateTime(r.received_at)],
  ];

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin?vue=demandes" className="inline-flex min-h-11 items-center text-sm text-discret underline">
          ← Retour aux demandes
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-titre text-3xl font-bold text-nuit">
            {r.first_name} {r.last_name}
          </h1>
          <StatusBadge status={r.status} />
        </div>
        <p className="mt-1 text-discret">{r.kind === "devis" ? "Demande de devis" : "Demande de dépannage"}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <a href={phoneHref} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-rouge font-semibold text-white">
            <Icon name="phone" size={18} strokeWidth={2} /> Appeler
          </a>
          <a href={`mailto:${r.email}`} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-nuit font-semibold text-white">
            <Icon name="mail" size={18} strokeWidth={2} /> E-mail
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-nuit font-semibold text-nuit sm:col-span-1"
          >
            <Icon name="pin" size={18} strokeWidth={2} /> Itinéraire
          </a>
        </div>

        <section className="mt-6 rounded-xl border border-ligne bg-white p-6">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[160px_1fr]">
            <dt className="text-discret">Téléphone</dt>
            <dd className="font-semibold">{r.phone}</dd>
            <dt className="text-discret">E-mail</dt>
            <dd className="break-all">{r.email}</dd>
            <dt className="text-discret">Adresse</dt>
            <dd>{address}</dd>
            {details.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-discret">{k}</dt>
                <dd className={k === "Urgence" && r.urgency === "tres_urgente" ? "font-semibold text-rouge-fonce" : ""}>{v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-6 font-semibold text-nuit">Description</h2>
          <p className="mt-2 whitespace-pre-line text-texte">{r.description}</p>
        </section>

        {photos.length > 0 ? (
          <section className="mt-6">
            <h2 className="font-titre text-xl font-bold text-nuit">Photos ({photos.length})</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p, i) => (
                <a key={p.path} href={p.signedUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-ligne">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.signedUrl} alt={`Photo ${i + 1} jointe à la demande`} className="h-40 w-full object-cover" />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-xl border border-ligne bg-white p-6">
          <h2 className="font-titre text-xl font-bold text-nuit">Statut</h2>
          <form action={updateRequestStatus} className="mt-3 flex flex-wrap gap-3">
            <input type="hidden" name="id" value={r.id} />
            <label htmlFor="status" className="sr-only">
              Statut de la demande
            </label>
            <select id="status" name="status" defaultValue={r.status} className="min-h-12 flex-1 rounded-lg border border-ligne bg-white px-3">
              {(Object.entries(requestStatuses) as [RequestStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="submit" className="min-h-12 rounded-lg bg-nuit px-6 font-semibold text-white">
              Enregistrer
            </button>
          </form>
          <p className="mt-3 text-sm text-discret">Pour planifier une intervention à partir de cette demande, utilisez « Planifier » dans l'onglet Demandes.</p>
        </section>
      </main>
    </>
  );
}
