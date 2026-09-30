import * as React from "react"
import { cn } from "@/lib/utils"

// Native constraints are handled by ContactForm. Keep the shadcn wrapper without
// Base UI's Field runtime so the initial route stays within ADR 0006's budget.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-none border-0 border-b border-ink-soft bg-transparent px-0 py-3 text-body text-ink transition-colors hover:bg-paper-2 focus:border-oxblood disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-oxblood",
        className
      )}
      {...props}
    />
  )
}

export { Input }
