"use client";

import { useExplorer, useExplorerDispatch } from "@/components/explorer/explorer-store";
import { Slider } from "@/components/ui/slider";
import { EXPLORER } from "@/content/site";
import { SLICE_AXES, SLICE_RANGE } from "@/lib/brain/slice";
import { sliceReadout } from "@/lib/brain/slice-readout";
import { cn } from "@/lib/utils";

/**
 * Slice's controls (DESIGN.md §9 "Tools"), shown while Slice is on: a segmented
 * control for the axis, a slider across the brain's bounds on it, and the mono
 * readout, e.g. "Coronal · y = −22 mm", which the slider announces as its value.
 */
export function SliceControls({ className }: { className?: string }) {
  const slice = useExplorer((state) => state.slice);
  const dispatch = useExplorerDispatch();
  const { min, max } = SLICE_RANGE[slice.axis];
  const readout = sliceReadout(EXPLORER.slice.axes[slice.axis].name, slice.axis, slice.mm);

  return (
    <div
      role="group"
      aria-label={EXPLORER.tools.slice}
      className={cn("flex flex-wrap items-stretch border border-rule bg-surface", className)}>
      {/* Native radios: one Tab stop, and the arrow keys move between the axes. */}
      <fieldset className="flex">
        <legend className="sr-only">{EXPLORER.slice.orientation}</legend>
        {SLICE_AXES.map((axis, index) => (
          <label
            key={axis}
            className={cn(
              "flex cursor-pointer flex-col justify-center gap-0.5 px-4 py-2 text-ink hover:bg-paper-2 has-checked:bg-oxblood-tint has-checked:text-oxblood has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-oxblood",
              index > 0 && "border-l border-rule",
            )}>
            <input
              type="radio"
              name="slice-axis"
              value={axis}
              checked={slice.axis === axis}
              onChange={() => dispatch({ type: "setSliceAxis", axis })}
              className="sr-only"
            />
            <span className="label">{EXPLORER.slice.axes[axis].name}</span>
            <span className="font-mono text-[11px] leading-tight text-ink-soft">{EXPLORER.slice.axes[axis].plane}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex grow items-center gap-4 border-l border-rule px-4 py-2 max-sm:basis-full max-sm:border-t max-sm:border-l-0">
        <Slider
          value={slice.mm}
          min={min}
          max={max}
          step={1}
          onValueChange={(mm) => dispatch({ type: "setSliceMm", mm })}
          thumbProps={{ "aria-label": EXPLORER.slice.position, getAriaValueText: () => readout }}
          className="min-w-32 grow sm:w-48"
        />
        {/* The slider announces the same text as its value. */}
        <p aria-hidden data-testid="slice-readout" className="w-[21ch] shrink-0 font-mono text-[12px] whitespace-nowrap text-ink tabular-nums">
          {readout}
        </p>
      </div>
    </div>
  );
}
