"use client";

import { X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { useExplorer, useExplorerDispatch } from "@/components/explorer/explorer-store";
import { focusStructureIndex } from "@/components/explorer/structure-index";
import { conditionsForStructure } from "@/content/conditions";
import { EXPLORER } from "@/content/site";
import { STRUCTURES, type StructureContent } from "@/content/structures";
import type { StructureId } from "@/lib/brain/structures";
import { cn } from "@/lib/utils";

/**
 * The Structure panel (DESIGN.md §9 "Interaction"): slides in from the right
 * while a Structure is the Focus. The live region is always mounted, so each
 * Structure's panel is announced politely as it arrives. It keeps showing the
 * last Structure while it slides out, then empties.
 */
export function StructurePanel({ className }: { className?: string }) {
  const focused = useExplorer((state) => (state.focus.kind === "structure" ? state.focus.id : null));
  const dispatch = useExplorerDispatch();
  const [shown, setShown] = useState<StructureId | null>(focused);
  if (focused && focused !== shown) setShown(focused);
  const open = focused !== null;
  const panelRef = useRef<HTMLElement>(null);
  const nameId = useId();

  /** Esc and the close control. Keyboard focus inside the panel goes back to the Structure index. */
  const close = () => {
    const panel = panelRef.current;
    const hadKeyboardFocus = panel?.contains(document.activeElement) ?? false;
    dispatch({ type: "clearFocus" });
    const section = panel?.closest("section");
    if (hadKeyboardFocus && section && shown) focusStructureIndex(section, shown);
  };

  // Esc works from anywhere in the Explorer, and from the page body after a canvas click.
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const target = event.target as Node;
    if (target !== document.body && !panelRef.current?.closest("section")?.contains(target)) return;
    close();
  });
  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  return (
    <div
      aria-live="polite"
      className={cn("pointer-events-none absolute inset-y-0 right-0 z-10 flex w-full lg:w-(--panel-w)", className)}>
      {shown ? (
        <aside
          ref={panelRef}
          aria-labelledby={nameId}
          data-testid="structure-panel"
          inert={!open}
          onTransitionEnd={(event) => {
            if (!open && event.target === event.currentTarget) setShown(null);
          }}
          className={cn(
            "pointer-events-auto flex w-full flex-col overflow-y-auto border-l border-rule bg-surface transition-[translate] duration-(--dur-base) ease-out starting:translate-x-full",
            open ? "translate-x-0" : "translate-x-full",
          )}>
          <PanelBody id={shown} nameId={nameId} onClose={close} />
        </aside>
      ) : null}
    </div>
  );
}

function PanelBody({ id, nameId, onClose }: { id: StructureId; nameId: string; onClose: () => void }) {
  const structure: StructureContent = STRUCTURES[id];
  const conditions = conditionsForStructure(id);
  return (
    <div className="flex flex-col gap-6 px-8 pt-6 pb-12">
      <button
        type="button"
        aria-label={EXPLORER.closePanel}
        onClick={onClose}
        className="-mr-2 self-end p-2 text-ink hover:text-oxblood">
        <X aria-hidden className="size-4" strokeWidth={1.5} />
      </button>
      <div className="flex flex-col gap-3">
        <h3 id={nameId} className="font-serif text-display-m text-ink">
          {structure.name}
        </h3>
        {structure.aka ? <p className="text-body-s text-ink-soft">{structure.aka}</p> : null}
        <p lang="la" className="latin text-ink-soft">
          {structure.latin}
        </p>
      </div>
      <p className="max-w-[65ch] text-body-s text-ink">{structure.description}</p>
      {/* Insula, Postcentral gyrus, Cingulate gyrus and Hypothalamus have none (ADR 0004). */}
      {conditions.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-rule pt-6">
          <h4 className="label text-ink-soft">{EXPLORER.conditionsLabel}</h4>
          <ul className="flex flex-wrap gap-2">
            {conditions.map((condition) => (
              <li key={condition.id}>
                <a
                  href={`#condition-${condition.id}`}
                  className="inline-block rounded-full bg-oxblood-tint px-2.5 py-[7px] text-[12.5px] leading-none font-medium text-oxblood underline-offset-4 hover:underline">
                  {condition.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
