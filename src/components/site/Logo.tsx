import Image from "next/image";
import Link from "next/link";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Électricité N.A.B. — accueil">
      <span className={inverted ? "flex h-12 w-12 items-center justify-center rounded-lg bg-white" : "flex h-12 w-12 items-center justify-center"}>
        <Image src="/images/logo-ampoule.png" alt="" width={44} height={42} priority />
      </span>
      <span className="flex flex-col">
        <span
          className={`font-titre text-xl font-bold leading-none tracking-wide sm:text-2xl ${inverted ? "text-white" : "text-nuit"}`}
        >
          ÉLECTRICITÉ N.A.B.
        </span>
        <span className="mt-1 block h-[3px] rounded bg-rouge" />
      </span>
    </Link>
  );
}
