import type { ComponentProps, CSSProperties } from "react";
import framing from "@/lib/brain/art-framing.json";
import { cn } from "@/lib/utils";

/** Home-camera projections from the GLB, fitted to the stage's camera bounds. */
export function SpecimenOutline({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      {...props}
      style={{ "--specimen-framing-ratio": framing.widthHeightRatio } as CSSProperties}
      className={cn("specimen-outline", className)}>
      {/* Both views share the cached SVG; the stage container chooses the projection. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/specimen-outline.svg" alt="" width={1000} height={1000} loading="lazy" className="specimen-outline-wide h-auto w-full" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/specimen-outline.svg#portrait" alt="" width={1000} height={1000} loading="lazy" className="specimen-outline-portrait h-auto w-full" />
    </span>
  );
}
