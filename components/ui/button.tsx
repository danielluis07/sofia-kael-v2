import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// DESIGN.md §10: buttons are pills; focus uses the global oxblood outline.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent font-sans font-medium whitespace-nowrap transition-colors duration-(--dur-fast) ease-out select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-oxblood [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-oxblood text-paper hover:bg-oxblood-deep",
        outline:
          "border-ink bg-transparent text-ink hover:bg-paper-2 aria-expanded:bg-paper-2",
        secondary:
          "bg-paper-2 text-ink hover:bg-rule aria-expanded:bg-rule",
        ghost:
          "text-ink hover:bg-paper-2 aria-expanded:bg-paper-2",
        destructive:
          "bg-oxblood-tint text-oxblood hover:bg-oxblood hover:text-paper",
        link: "rounded-none text-ink underline decoration-rule underline-offset-4 hover:decoration-oxblood",
      },
      size: {
        default:
          "h-11 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-[0.8125rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-13 gap-2 px-7 text-base has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-13 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    compoundVariants: [
      // Text links size to their text, not to a pill.
      { variant: "link", className: "h-auto px-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
