"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { useExplorer, useExplorerDispatch } from "@/components/explorer/explorer-store";
import { useMediaQuery } from "@/components/explorer/use-media-query";
import { EXPLORER } from "@/content/site";
import { STRUCTURES } from "@/content/structures";
import { STRUCTURE_IDS, type StructureId } from "@/lib/brain/structures";
import { cn } from "@/lib/utils";

/**
 * The accessible way to reach every Structure (DESIGN.md §9): a collapsible
 * mono list pinned top-right of the stage. One Tab stop; the arrow keys, Home
 * and End move between rows, and Enter or Space selects. Keyboard focus on a
 * row feeds the callout, like canvas hover.
 */
export function StructureIndex({ className }: { className?: string }) {
  const selected = useExplorer((state) => (state.focus.kind === "structure" ? state.focus.id : null));
  const dispatch = useExplorerDispatch();
  const listId = useId();
  // Open on wide stages; a phone collapses it until the mobile slice's bottom sheet takes over.
  const wide = useMediaQuery("(min-width: 48rem)", true);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? wide;
  const [active, setActive] = useState<StructureId | null>(null);
  const tabStop = selected ?? active ?? STRUCTURE_IDS[0];

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const rows = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-structure]")];
    const current = rows.indexOf(document.activeElement as HTMLButtonElement);
    const next = {
      ArrowDown: Math.min(current + 1, rows.length - 1),
      ArrowUp: Math.max(current - 1, 0),
      Home: 0,
      End: rows.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    rows[next]?.focus();
  };

  return (
    <div className={cn("flex w-56 flex-col border border-rule bg-surface", className)}>
      <button
        type="button"
        data-structure-index-toggle=""
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setToggled(!open)}
        className="label flex items-center justify-between gap-2 px-3 py-2.5 text-ink focus-visible:outline-offset-[-2px]">
        {EXPLORER.structureIndex}
        <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-(--dur-fast)", open && "rotate-180")} strokeWidth={1.5} />
      </button>
      <ul
        id={listId}
        hidden={!open}
        aria-label={EXPLORER.structureIndex}
        onKeyDown={onKeyDown}
        className="min-h-0 overflow-y-auto border-t border-rule py-1">
        {STRUCTURE_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              data-structure={id}
              tabIndex={id === tabStop ? 0 : -1}
              aria-current={id === selected ? "true" : undefined}
              onClick={() => dispatch({ type: "select", id })}
              onFocus={() => {
                setActive(id);
                dispatch({ type: "hover", id });
              }}
              onBlur={() => dispatch({ type: "unhover", id })}
              className={cn(
                "w-full px-3 py-1.5 text-left font-mono text-xs text-ink hover:bg-paper-2 focus-visible:outline-offset-[-2px]",
                id === selected && "bg-oxblood-tint text-oxblood hover:bg-oxblood-tint",
              )}>
              {STRUCTURES[id].name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Puts keyboard focus back on the index after the panel closes: on `id`'s row
 * (the row the index would Tab to, for a Condition), or the toggle if the list is collapsed.
 */
export function focusStructureIndex(root: ParentNode, id: StructureId | null) {
  const row = root.querySelector<HTMLElement>(id ? `[data-structure="${id}"]` : `[data-structure][tabindex="0"]`);
  if (row?.checkVisibility()) row.focus();
  else root.querySelector<HTMLElement>("[data-structure-index-toggle]")?.focus();
}
