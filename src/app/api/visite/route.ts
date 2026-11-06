import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Enregistre une page vue du site public. Aucun cookie, aucune IP stockée :
// l'empreinte du visiteur est hachée avec un sel secret qui change chaque jour.

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python|vercel/i;

function sourceOf(referrer: string | null, host: string | null): string {
  if (!referrer) return "direct";
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "");
    if (host && h === host.replace(/^www\./, "")) return "direct";
    if (/google\./.test(h)) return "google";
    if (/bing\.|duckduckgo|qwant|ecosia|yahoo\./.test(h)) return "autre moteur";
    if (/facebook|fb\.|messenger/.test(h)) return "facebook";
    if (/instagram/.test(h)) return "instagram";
    if (/linkedin|lnkd/.test(h)) return "linkedin";
    if (/whatsapp|wa\.me/.test(h)) return "whatsapp";
    return h.slice(0, 100);
  } catch {
    return "direct";
  }
}

export async function POST(req: NextRequest) {
  const ok = new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua) || req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return ok;
  // Les visites des administrateurs connectés ne sont pas comptées.
  if (req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))) return ok;

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return ok;
  }
  const path = typeof body.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 300) : "";
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/devis/") || path.startsWith("/api")) return ok;
  const referrer = typeof body.referrer === "string" ? body.referrer : null;

  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ?? "";
  const visitorHash = createHash("sha256")
    .update(`${day}|${ip}|${ua}|${process.env.SUPABASE_SECRET_KEY ?? ""}`)
    .digest("hex");
  const device = /ipad|tablet/i.test(ua) ? "tablette" : /mobi|android|iphone/i.test(ua) ? "mobile" : "ordinateur";

  try {
    const sb = createAdminClient();
    await sb.from("page_views").insert({
      day,
      path,
      visitor_hash: visitorHash,
      source: sourceOf(referrer, req.headers.get("host")),
      device,
    });
    if (Math.random() < 0.02) await sb.rpc("purge_old_page_views");
  } catch {
    // Le comptage ne doit jamais gêner la navigation.
  }
  return ok;
}
