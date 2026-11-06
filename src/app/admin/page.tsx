import { requireAdmin } from "@/lib/auth";
import { signOut } from "./actions";

// Tableau de bord provisoire : construit en phase 4.
export default async function AdminHomePage() {
  const { supabase, user } = await requireAdmin();

  const { count: newRequests } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "nouvelle");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-titre text-3xl font-bold text-nuit">Tableau de bord</h1>
        <form action={signOut}>
          <button type="submit" className="min-h-11 text-sm text-nuit underline">
            Déconnexion
          </button>
        </form>
      </div>
      <p className="mt-2 text-discret">Connecté : {user.email}</p>
      <section className="mt-8 rounded-xl border border-ligne bg-white p-6">
        <p className="text-sm uppercase tracking-widest text-discret">Nouvelles demandes</p>
        <p className="mt-2 font-titre text-4xl font-bold text-nuit">{newRequests ?? 0}</p>
      </section>
      <p className="mt-8 text-sm text-discret">
        Espace en construction : agenda, demandes, devis et statistiques arrivent dans les prochaines phases.
      </p>
    </main>
  );
}
