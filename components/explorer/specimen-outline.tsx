import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A temporary line drawing of the brain in left lateral view, shown while the
 * specimen loads and in the no-WebGL fallback. "Draw the brain-derived art"
 * replaces it with an outline traced from the model.
 */
export function SpecimenOutline({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
      className={cn("text-ink-soft [&_path]:[vector-effect:non-scaling-stroke]", className)}>
      {/* Cerebrum: frontal pole at left, occipital pole at right. */}
      <path d="M72 186C44 150 52 88 108 58C160 30 250 26 310 58C358 84 378 136 360 176C352 194 334 204 312 204C286 206 262 214 238 216C214 218 190 222 168 226C140 232 110 226 98 208C90 198 80 194 72 186Z" />
      {/* Lateral sulcus and central sulcus. */}
      <path d="M104 204C142 184 196 166 262 152" />
      <path d="M226 34C218 72 206 112 190 170" />
      {/* Cerebellum, tucked under the occipital lobe. */}
      <path d="M268 214C296 204 332 204 346 220C356 236 344 256 316 262C290 266 266 256 256 240" />
      {/* Brainstem. */}
      <path d="M218 218C222 240 226 262 232 290" />
      <path d="M252 218C250 240 252 262 258 290" />
    </svg>
  );
}
