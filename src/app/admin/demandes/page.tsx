import { redirect } from "next/navigation";

// La liste des demandes est désormais un onglet de l'application d'administration.
export default function RequestsPage() {
  redirect("/admin?vue=demandes");
}
