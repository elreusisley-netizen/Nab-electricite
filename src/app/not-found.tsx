import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-nuit px-6 text-white">
      <div className="max-w-md text-center">
        <p className="font-titre text-6xl font-bold">404</p>
        <h1 className="mt-4 font-titre text-3xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-white/85">Cette page n'existe pas ou a été déplacée.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-12 items-center rounded-lg bg-rouge px-6 font-semibold hover:bg-rouge-fonce">
            Retour à l'accueil
          </Link>
          <a href="tel:+33666614373" className="inline-flex min-h-12 items-center rounded-lg border-2 border-white px-6 font-semibold">
            06 66 61 43 73
          </a>
        </div>
      </div>
    </main>
  );
}
