import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

/**
 * A single-thumb slider in the site's hairline style: a 1px `--ink-soft` track
 * and a hollow `--oxblood` ring for a thumb, like the leader-line callout's
 * anchor (DESIGN.md §6). The thumb's hidden range input carries the label and
 * value text, so `thumbProps` passes them through.
 */
function Slider({
  className,
  thumbProps,
  ...props
}: SliderPrimitive.Root.Props<number> & { thumbProps?: SliderPrimitive.Thumb.Props }) {
  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full", className)}
      data-slot="slider"
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-6 w-full touch-none items-center select-none data-disabled:opacity-50">
        <SliderPrimitive.Track data-slot="slider-track" className="relative h-px w-full grow bg-ink-soft select-none" />
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          {...thumbProps}
          className={cn(
            // The shared focus ring lands on the hidden input; the thumb shows it instead.
            "relative block size-3.5 shrink-0 rounded-full border-[1.5px] border-oxblood bg-surface select-none after:absolute after:-inset-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-oxblood data-dragging:bg-oxblood-tint",
            thumbProps?.className as string | undefined,
          )}
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
