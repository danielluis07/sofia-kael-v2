import type { StaticImageData } from "next/image";
import hero from "@/content/portraits/sofia-hero.png";
import about from "@/content/portraits/sofia-about.png";

export type PortraitContent = { src: StaticImageData; alt: string };

export const PORTRAITS = {
  hero: {
    src: hero,
    alt: "Dra. Sofia Kael, de cabelos acobreados, em pé, usando um blazer bege-acinzentado e com as mãos levemente unidas.",
  },
  about: {
    src: about,
    alt: "Dra. Sofia Kael sentada em uma poltrona de tom neutro, usando um blazer bege-acinzentado e com as mãos apoiadas no colo.",
  },
} as const satisfies Record<"hero" | "about", PortraitContent | null>;

export const PORTRAIT_CAPTION = "Retrato da Dra. Kael · em breve";
