import Link from "next/link";
import { Icon } from "@/components/icons";
import { company } from "@/content/site";

// Barre fixe en bas de l'écran sur mobile : les deux actions qui comptent.
export function MobileCallBar() {
  return (
    <nav
      aria-label="Actions rapides"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-ligne bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
    >
      <a
        href={company.phoneHref}
        className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-nuit font-semibold text-white"
      >
        <Icon name="phone" size={18} strokeWidth={2} />
        Appeler
      </a>
      <Link href="/devis" className="flex min-h-12 items-center justify-center rounded-lg bg-rouge font-semibold text-white">
        Demander un devis
      </Link>
    </nav>
  );
}
