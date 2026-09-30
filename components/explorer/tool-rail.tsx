"use client";

import { Focus, RotateCcw, ScanEye, UnfoldHorizontal, type LucideIcon } from "lucide-react";
import { useExplorer, useExplorerDispatch } from "@/components/explorer/explorer-store";
import { EXPLORER } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The tool rail (DESIGN.md §9 "Tools"): bottom centre, a hairline-bordered
 * `--surface` bar of real buttons, each a 20px lucide icon and a mono label.
 * Toggles carry `aria-pressed`. Slice arrives with its tool.
 */
export function ToolRail({ className }: { className?: string }) {
  const split = useExplorer((state) => state.split);
  const xray = useExplorer((state) => state.xray);
  const dispatch = useExplorerDispatch();
  return (
    <div role="group" aria-label={EXPLORER.toolsLabel} className={cn("flex border border-rule bg-surface", className)}>
      <ToolButton icon={UnfoldHorizontal} rail pressed={split} onClick={() => dispatch({ type: "toggleSplit" })}>
        {EXPLORER.tools.split}
      </ToolButton>
      <ToolButton
        icon={ScanEye}
        rail
        pressed={xray}
        onClick={() => dispatch({ type: "toggleXray" })}
        className="border-l border-rule">
        {EXPLORER.tools.xray}
      </ToolButton>
      <IsolateToggle rail className="border-l border-rule" />
      <ToolButton icon={RotateCcw} rail onClick={() => dispatch({ type: "reset" })} className="border-l border-rule">
        {EXPLORER.tools.reset}
      </ToolButton>
    </div>
  );
}

/** Isolate, on the rail and in the Structure panel. `aria-disabled` without a Focus (ADR 0003). */
export function IsolateToggle({ rail = false, className }: { rail?: boolean; className?: string }) {
  const isolate = useExplorer((state) => state.isolate);
  const disabled = useExplorer((state) => state.focus.kind === "none");
  const dispatch = useExplorerDispatch();
  return (
    <ToolButton
      icon={Focus}
      rail={rail}
      pressed={isolate}
      disabled={disabled}
      onClick={() => dispatch({ type: "toggleIsolate" })}
      className={className}>
      {EXPLORER.tools.isolate}
    </ToolButton>
  );
}

function ToolButton({
  icon: Icon,
  rail,
  pressed,
  disabled = false,
  onClick,
  className,
  children,
}: {
  icon: LucideIcon;
  /** 20px icons on the rail, 16px elsewhere (DESIGN.md §10). */
  rail: boolean;
  /** Toggles only. */
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      // Still focusable and announced; it just does nothing yet.
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "label flex items-center gap-2 text-ink hover:bg-paper-2 focus-visible:outline-offset-[-2px] aria-disabled:cursor-default aria-disabled:text-ink-soft aria-disabled:hover:bg-transparent",
        rail ? "px-4 py-3" : "px-3 py-2.5",
        pressed && "bg-oxblood-tint text-oxblood hover:bg-oxblood-tint",
        className,
      )}>
      <Icon aria-hidden className={rail ? "size-5" : "size-4"} strokeWidth={1.5} />
      {children}
    </button>
  );
}
