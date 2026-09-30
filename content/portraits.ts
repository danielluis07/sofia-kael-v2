import type { StaticImageData } from "next/image";
import hero from "@/content/portraits/sofia-hero.png";
import about from "@/content/portraits/sofia-about.png";

export type PortraitContent = { src: StaticImageData; alt: string };

export const PORTRAITS = {
  hero: {
    src: hero,
    alt: "Dr. Sofia Kael with copper hair, wearing a taupe blazer and standing with her hands loosely clasped.",
  },
  about: {
    src: about,
    alt: "Dr. Sofia Kael seated in a neutral upholstered chair, wearing a taupe blazer with her hands resting in her lap.",
  },
} as const satisfies Record<"hero" | "about", PortraitContent | null>;

export const PORTRAIT_CAPTION = "Portrait of Dr. Kael · forthcoming";
