"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Compte une page vue à chaque changement de page (mesure d'audience sans cookie). */
export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || null });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("/api/visite", new Blob([body], { type: "application/json" }));
      else fetch("/api/visite", { method: "POST", body, keepalive: true }).catch(() => {});
    } catch {
      // ignoré
    }
  }, [pathname]);
  return null;
}
