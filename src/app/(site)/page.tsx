import Image from "next/image";

// Page d'attente : remplacée par la vraie page d'accueil en phase 2.
export default function HomePage() {
  return (
    <main className="min-h-screen bg-nuit text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white">
            <Image src="/images/logo-ampoule.png" alt="" width={48} height={46} priority />
          </span>
          <span className="font-titre text-3xl font-bold tracking-wide">ÉLECTRICITÉ N.A.B.</span>
        </div>
        <div className="h-1 w-16 rounded bg-rouge" />
        <h1 className="font-titre text-4xl font-bold leading-tight sm:text-5xl">
          Installation, rénovation et dépannage électrique
        </h1>
        <p className="text-lg text-white/85">
          Notre nouveau site arrive bientôt. En attendant, nous restons joignables 7j/7, soir et week-end compris.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="tel:+33666614373"
            className="inline-flex min-h-12 items-center rounded-lg bg-rouge px-6 font-titre text-xl font-bold hover:bg-rouge-fonce"
          >
            06 66 61 43 73
          </a>
          <a
            href="mailto:nabelectricite@gmail.com"
            className="inline-flex min-h-12 items-center rounded-lg border-2 border-white px-6 font-semibold hover:bg-white hover:text-nuit"
          >
            nabelectricite@gmail.com
          </a>
        </div>
        <p className="text-sm text-white/70">Bordeaux · toute la Nouvelle-Aquitaine</p>
      </div>
    </main>
  );
}
