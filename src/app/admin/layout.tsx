import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/admin/ServiceWorkerRegister";

// L'administration dépend toujours de la session : jamais de pré-génération statique.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  manifest: "/manifest-admin.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "NAB Admin", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#0e2240" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-fond">
      {children}
      <ServiceWorkerRegister />
    </div>
  );
}
