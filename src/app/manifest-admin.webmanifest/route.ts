// Manifeste PWA de l'administration : s'installe sur le téléphone comme une application « NAB Admin ».
// Placé hors de /admin pour rester accessible sans session (le navigateur le charge sans cookies).
export function GET() {
  return Response.json(
    {
      id: "/admin",
      name: "Électricité N.A.B. – Administration",
      short_name: "NAB Admin",
      description: "Agenda des interventions, demandes de devis et de dépannage.",
      lang: "fr",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      orientation: "portrait",
      background_color: "#f3f5f8",
      theme_color: "#0e2240",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [
        { name: "Agenda", url: "/admin" },
        { name: "Demandes", url: "/admin?vue=demandes" },
        { name: "Statistiques", url: "/admin?vue=statistiques" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
