"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { keysOf, requestStatuses } from "@/lib/labels";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(keysOf(requestStatuses)),
});

export async function updateRequestStatus(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = schema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;

  const { error } = await supabase.from("requests").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) {
    console.error("[demandes] statut", error.message);
    return;
  }
  await supabase.from("activity_log").insert({
    entity: "requests",
    entity_id: parsed.data.id,
    action: `statut:${parsed.data.status}`,
    actor_id: user.id,
  });
  revalidatePath("/admin/demandes");
  revalidatePath(`/admin/demandes/${parsed.data.id}`);
  revalidatePath("/admin");
}
