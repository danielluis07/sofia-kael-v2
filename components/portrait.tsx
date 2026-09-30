import Image from "next/image";
import { PORTRAIT_CAPTION, type PortraitContent } from "@/content/portraits";
import { cn } from "@/lib/utils";

type PortraitProps = {
  portrait: PortraitContent | null;
  crop: "hero" | "about";
  className?: string;
};

/** Local portraits and intentional empty frames share a stable crop (ADR 0005). */
export function Portrait({ portrait, crop, className }: PortraitProps) {
  return (
    <div
      className={cn(
        "relative",
        crop === "hero" ? "aspect-4/5" : "aspect-3/4",
        !portrait && "flex items-end bg-paper-2 p-6",
        className,
      )}>
      {portrait ? (
        <Image
          src={portrait.src}
          alt={portrait.alt}
          fill
          loading={crop === "hero" ? "eager" : "lazy"}
          fetchPriority={crop === "hero" ? "high" : undefined}
          sizes={crop === "hero" ? "(min-width: 1280px) 480px, (min-width: 768px) 40vw, 100vw" : "(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"}
          placeholder="empty"
          className={crop === "hero" ? "object-contain object-bottom" : "object-cover"}
        />
      ) : (
        <p className="label text-ink-soft">{PORTRAIT_CAPTION}</p>
      )}
    </div>
  );
}
