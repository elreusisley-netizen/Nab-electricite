import { AdminApp } from "@/components/admin/AdminApp";
import { requireAdmin } from "@/lib/auth";

// Vérification serveur (session + rôle administrateur), puis application de l'admin côté navigateur.
export default async function AdminHomePage() {
  const { user } = await requireAdmin();
  return <AdminApp email={user.email ?? ""} />;
}
