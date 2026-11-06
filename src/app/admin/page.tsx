import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";

// Tableau de bord provisoire : la version complète (carrousel, agenda, chiffre d'affaires) arrive en phase 4.
export default async function AdminHomePage() {
  const { supabase, user } = await requireAdmin();

  const count = async (kind: "devis" | "depannage", urgentOnly = false) => {
    let q = supabase.from("requests").select("id", { count: "exact", head: true }).eq("kind", kind).eq("status", "nouvelle");
    if (urgentOnly) q = q.eq("urgency", "tres_urgente");
    const { count: n } = await q;
    return n ?? 0;
  };
  const [newDevis, newDepannages, urgent] = await Promise.all([count("devis"), count("depannage"), count("depannage", true)]);

  const cards = [
    { label: "Nouvelles demandes de devis", value: newDevis, href: "/admin/demandes?type=devis", alert: false },
    { label: "Nouveaux dépannages", value: newDepannages, href: "/admin/demandes?type=depannage", alert: false },
    { label: "Dépannages urgents", value: urgent, href: "/admin/demandes?type=depannage", alert: urgent > 0 },
  ];

  return (
    <>
      <AdminHeader current="accueil" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-titre text-3xl font-bold text-nuit">Tableau de bord</h1>
        <p className="mt-1 text-discret">Connecté : {user.email}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`rounded-xl border p-6 ${c.alert ? "border-rouge bg-rouge text-white" : "border-ligne bg-white text-nuit hover:border-nuit"}`}
            >
              <p className={`text-sm uppercase tracking-widest ${c.alert ? "text-white/85" : "text-discret"}`}>{c.label}</p>
              <p className="mt-2 font-titre text-4xl font-bold">{c.value}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-discret">
          Espace en construction : agenda, devis, clients et statistiques arrivent dans les prochaines phases.
        </p>
      </main>
    </>
  );
}
