"use client";

import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import { useExplorer } from "@/components/explorer/explorer-store";
import { STRUCTURES } from "@/content/structures";

/** A point in the stage, in CSS pixels from its top-left corner. */
export type StagePoint = { x: number; y: number };

/** The scene drives the callout every frame, without re-rendering React. */
export type CalloutHandle = {
  /** Where the hovered Structure's surface point is on screen, or null to hide the callout. */
  place: (anchor: StagePoint | null) => void;
};

/** The 8px ring's radius. */
const RING = 4;
/** Room between the caption and the line's end, and the shortest horizontal run. */
const GAP = 8;
const MIN_RUN = 16;
/** The caption keeps clear of the section headline above, and of the hint and the tool rail below. */
const CLEAR_BELOW_TITLE = 24;
const CLEAR_ABOVE_BOTTOM = 136;

type Metrics = { width: number; height: number; gutter: number; caption: number; minY: number };

/**
 * The leader-line callout (DESIGN.md §6): an 8px hollow `--oxblood` ring on the
 * hovered Structure's surface point, a 1px `--ink-soft` line with at most one
 * bend, and a mono caption in the stage margin, drawn in over 250ms. One at a
 * time, naming the Structure, not the side. Decorative: the Structure index
 * already names every Structure.
 */
export function StructureCallout({ ref }: { ref: Ref<CalloutHandle> }) {
  const hovered = useExplorer((state) => state.hovered);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const metrics = useRef<Metrics | null>(null);

  // Remeasure when the caption's text changes or the stage resizes.
  useLayoutEffect(() => {
    metrics.current = null;
  }, [hovered]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => (metrics.current = null));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    place(anchor) {
      const root = rootRef.current;
      const [line, ring, caption] = [lineRef.current, ringRef.current, captionRef.current];
      if (!root) return;
      if (!anchor || !line || !ring || !caption) {
        root.style.visibility = "hidden";
        return;
      }
      const m = (metrics.current ??= measure(root, caption, gutterRef.current));
      const inside = anchor.x >= 0 && anchor.x <= m.width && anchor.y >= 0 && anchor.y <= m.height;
      root.style.visibility = inside ? "visible" : "hidden";
      if (!inside) return;

      // The caption sits in the left margin, or the right one when the anchor is too far left.
      const left = anchor.x - RING - MIN_RUN >= m.gutter + m.caption + GAP;
      const captionY = Math.min(Math.max(anchor.y, m.minY), m.height - CLEAR_ABOVE_BOTTOM);
      const start = left ? m.gutter + m.caption + GAP : m.width - m.gutter - m.caption - GAP;
      // One bend: a horizontal run at the caption's height, then a 45° leg to the ring.
      const rise = Math.abs(anchor.y - captionY);
      const kneeX = left ? Math.max(start, anchor.x - rise) : Math.min(start, anchor.x + rise);
      const dx = anchor.x - kneeX;
      const dy = anchor.y - captionY;
      const length = Math.hypot(dx, dy) || 1;
      const endX = anchor.x - (dx / length) * RING;
      const endY = anchor.y - (dy / length) * RING;
      line.setAttribute("d", `M${start} ${captionY}H${kneeX}L${endX} ${endY}`);
      ring.setAttribute("cx", `${anchor.x}`);
      ring.setAttribute("cy", `${anchor.y}`);
      const captionX = left ? m.gutter : m.width - m.gutter - m.caption;
      caption.style.transform = `translate(${captionX}px, ${captionY}px) translateY(-50%)`;
    },
  }));

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none invisible absolute inset-0">
      {/* Resolves the clamp()ed `--gutter` to pixels. */}
      <div ref={gutterRef} className="absolute w-(--gutter)" />
      {hovered ? (
        <>
          <svg className="absolute inset-0 size-full overflow-visible" fill="none">
            <path
              key={`line-${hovered}`}
              ref={lineRef}
              pathLength={1}
              strokeDasharray="1"
              className="animate-callout-draw stroke-ink-soft"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              key={`ring-${hovered}`}
              ref={ringRef}
              r={RING}
              className="animate-callout-fade stroke-oxblood"
              strokeWidth={1.5}
            />
          </svg>
          <p
            key={`caption-${hovered}`}
            ref={captionRef}
            className="label animate-callout-fade absolute top-0 left-0 whitespace-nowrap text-ink">
            {STRUCTURES[hovered].name}
          </p>
        </>
      ) : null}
    </div>
  );
}

function measure(root: HTMLElement, caption: HTMLElement, gutter: HTMLElement | null): Metrics {
  const box = root.getBoundingClientRect();
  const title = root.closest("section")?.querySelector("h2")?.getBoundingClientRect();
  return {
    width: box.width,
    height: box.height,
    gutter: gutter?.offsetWidth ?? 16,
    caption: caption.getBoundingClientRect().width,
    minY: title ? title.bottom - box.top + CLEAR_BELOW_TITLE : 0,
  };
}
