import Link from "next/link";
import { signOut } from "@/app/admin/actions";

// En-tête provisoire de l'admin ; la navigation complète (onglets en bas sur mobile) arrive en phase 4.
export function AdminHeader({ current }: { current: "accueil" | "demandes" }) {
  const link = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center border-b-2 px-1 font-semibold ${active ? "border-rouge text-nuit" : "border-transparent text-discret"}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="border-b border-ligne bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4">
        <nav className="flex gap-6" aria-label="Administration">
          {link("/admin", "Tableau de bord", current === "accueil")}
          {link("/admin/demandes", "Demandes", current === "demandes")}
        </nav>
        <form action={signOut}>
          <button type="submit" className="min-h-11 text-sm text-nuit underline">
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
