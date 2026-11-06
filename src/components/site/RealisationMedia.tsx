import Image from "next/image";
import type { Realisation } from "@/content/site";

// Photo ou vidéo d'une réalisation, dans un cadre de hauteur fixe.
export function RealisationMedia({ r, heightClass, sizes }: { r: Realisation; heightClass: string; sizes: string }) {
  if (r.video) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-nuit ${heightClass}`}>
        <video
          src={r.video}
          poster={r.src}
          controls
          playsInline
          preload="none"
          aria-label={r.alt}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-xl bg-fond ${heightClass}`}>
      <Image src={r.src} alt={r.alt} fill sizes={sizes} className="object-cover" style={r.focus ? { objectPosition: r.focus } : undefined} />
    </div>
  );
}
