import type { Metadata } from "next";

// L'administration dépend toujours de la session : jamais de pré-génération statique.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-fond">{children}</div>;
}
