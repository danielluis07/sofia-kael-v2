import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y rounded-none border-0 border-b border-ink-soft bg-transparent px-0 py-3 text-body text-ink transition-colors hover:bg-paper-2 focus:border-oxblood disabled:opacity-50 aria-invalid:border-oxblood",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
