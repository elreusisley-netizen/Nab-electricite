"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/site/Logo";
import { company, mainNav, services } from "@/content/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ligne bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[15px] font-medium">
            {mainNav.map((item) =>
              item.href === "/prestations" ? (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={`inline-flex items-center gap-1 py-2 text-nuit hover:text-rouge-fonce ${
                      isActive(pathname, item.href) ? "border-b-2 border-rouge" : ""
                    }`}
                  >
                    {item.label}
                    <Icon name="chevron" size={16} />
                  </Link>
                  <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="rounded-xl border border-ligne bg-white p-2 shadow-lg">
                      {services.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/prestations/${s.slug}`}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-nuit hover:bg-fond"
                          >
                            <Icon name={s.icon} size={20} className={s.icon === "bolt" ? "text-rouge" : "text-nuit"} />
                            {s.shortTitle}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={`py-2 text-nuit hover:text-rouge-fonce ${
                      isActive(pathname, item.href) ? "border-b-2 border-rouge" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a href={company.phoneHref} className="flex items-center gap-2 text-nuit">
            <Icon name="phone" size={22} strokeWidth={2} />
            <span className="flex flex-col leading-tight">
              <span className="font-titre text-xl font-bold">{company.phone}</span>
              <span className="text-[13px] font-medium text-rouge-fonce">Dépannage 7j/7</span>
            </span>
          </a>
          <Link
            href="/devis"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rouge px-5 font-semibold text-white hover:bg-rouge-fonce"
          >
            Demander un devis
            <Icon name="arrow" size={18} strokeWidth={2} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-ligne text-nuit lg:hidden"
        >
          <Icon name={open ? "close" : "menu"} size={22} strokeWidth={2} />
        </button>
      </div>

      {open ? (
        <nav id="menu-mobile" aria-label="Menu mobile" className="border-t border-ligne bg-white lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={`flex min-h-12 items-center border-b border-ligne text-lg font-medium ${
                    isActive(pathname, item.href) ? "text-rouge-fonce" : "text-nuit"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/depannage" className="flex min-h-12 items-center text-lg font-medium text-rouge-fonce">
                Dépannage 7j/7
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
