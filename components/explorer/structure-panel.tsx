"use client";

import { X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, type MouseEvent } from "react";
import { useExplorer, useExplorerDispatch } from "@/components/explorer/explorer-store";
import { focusStructureIndex } from "@/components/explorer/structure-index";
import { IsolateToggle } from "@/components/explorer/tool-rail";
import { conditionById, conditionsForStructure, type ConditionId } from "@/content/conditions";
import { EXPLORER } from "@/content/site";
import { STRUCTURES, type StructureContent } from "@/content/structures";
import { sameFocus, type Focus } from "@/lib/brain/explorer-state";
import { conditionFocusHref, conditionRowHref, JUMP_ATTRIBUTE, PANEL_TITLE_ATTRIBUTE } from "@/lib/brain/explorer-url";
import type { StructureId } from "@/lib/brain/structures";
import { cn } from "@/lib/utils";

type Shown = Exclude<Focus, { kind: "none" }>;

/**
 * The Structure panel, or the Condition panel while a Condition is the Focus
 * (DESIGN.md §9 "Interaction"): slides in from the right. The live region is
 * always mounted, so each panel is announced politely as it arrives. It keeps
 * showing the last Focus while it slides out, then empties.
 */
export function StructurePanel({ className }: { className?: string }) {
  const focus = useExplorer((state) => state.focus);
  const dispatch = useExplorerDispatch();
  const [shown, setShown] = useState<Shown | null>(focus.kind === "none" ? null : focus);
  if (focus.kind !== "none" && !(shown && sameFocus(focus, shown))) setShown(focus);
  const open = focus.kind !== "none";
  const panelRef = useRef<HTMLElement>(null);
  const nameId = useId();

  /** Esc, the close control and "Clear". Keyboard focus inside the panel goes back to the Structure index. */
  const close = () => {
    const panel = panelRef.current;
    const hadKeyboardFocus = panel?.contains(document.activeElement) ?? false;
    dispatch({ type: "clearFocus" });
    const section = panel?.closest("section");
    if (hadKeyboardFocus && section && shown) focusStructureIndex(section, shown.kind === "structure" ? shown.id : null);
  };

  /** A panel row or the back link swapped what the panel shows: keyboard focus follows to its heading. */
  const navigate = (action: { type: "select"; id: StructureId } | { type: "focusCondition"; id: ConditionId }) => {
    dispatch(action);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(`[${PANEL_TITLE_ATTRIBUTE}]`)?.focus());
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
          {/* Below lg the panel is full width and the tool rail floats over its foot. */}
          <div className="flex flex-col gap-6 px-8 pt-6 pb-28 lg:pb-12">
            <button
              type="button"
              aria-label={EXPLORER.closePanel}
              onClick={close}
              className="-mr-2 self-end p-2 text-ink hover:text-oxblood">
              <X aria-hidden className="size-4" strokeWidth={1.5} />
            </button>
            {shown.kind === "structure" ? (
              <StructureBody
                id={shown.id}
                via={shown.via}
                nameId={nameId}
                onBack={(via) => navigate({ type: "focusCondition", id: via })}
              />
            ) : (
              <ConditionBody
                id={shown.id}
                nameId={nameId}
                onSelect={(id) => navigate({ type: "select", id })}
                onClear={close}
              />
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function PanelTitle({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} tabIndex={-1} {...{ [PANEL_TITLE_ATTRIBUTE]: "" }} className="font-serif text-display-m text-ink">
      {children}
    </h3>
  );
}

function StructureBody({
  id,
  via,
  nameId,
  onBack,
}: {
  id: StructureId;
  via?: ConditionId;
  nameId: string;
  onBack: (via: ConditionId) => void;
}) {
  const structure: StructureContent = STRUCTURES[id];
  const conditions = conditionsForStructure(id);
  return (
    <>
      {via ? (
        // An in-Explorer move: it replaces the URL like any selection, so it isn't a jump.
        <a
          href={conditionFocusHref(via)}
          onClick={(event: MouseEvent) => {
            event.preventDefault();
            onBack(via);
          }}
          className="label -mt-4 self-start text-ink-soft hover:text-oxblood">
          <span aria-hidden="true">← </span>
          <span className="sr-only">{EXPLORER.backTo} </span>
          {conditionById(via).name}
        </a>
      ) : null}
      <div className="flex flex-col gap-3">
        <PanelTitle id={nameId}>{structure.name}</PanelTitle>
        {structure.aka ? <p className="text-body-s text-ink-soft">{structure.aka}</p> : null}
        <p lang="la" className="latin text-ink-soft">
          {structure.latin}
        </p>
      </div>
      <p className="max-w-[65ch] text-body-s text-ink">{structure.description}</p>
      <IsolateToggle className="self-start border border-rule" />
      {/* Insula, Postcentral gyrus, Cingulate gyrus and Hypothalamus have none (ADR 0004). */}
      {conditions.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-rule pt-6">
          <h4 className="label text-ink-soft">{EXPLORER.conditionsLabel}</h4>
          <ul className="flex flex-wrap gap-2">
            {conditions.map((condition) => (
              <li key={condition.id}>
                <a
                  href={conditionRowHref(condition.id)}
                  {...{ [JUMP_ATTRIBUTE]: "" }}
                  className="inline-block rounded-full bg-oxblood-tint px-2.5 py-[7px] text-[12.5px] leading-none font-medium text-oxblood underline-offset-4 hover:underline">
                  {condition.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function ConditionBody({
  id,
  nameId,
  onSelect,
  onClear,
}: {
  id: ConditionId;
  nameId: string;
  onSelect: (id: StructureId) => void;
  onClear: () => void;
}) {
  const condition = conditionById(id);
  return (
    <>
      <PanelTitle id={nameId}>{condition.name}</PanelTitle>
      <p className="max-w-[65ch] text-body-s text-ink">{condition.description}</p>
      <div className="flex flex-col gap-3 border-t border-rule pt-6">
        <h4 className="label text-ink-soft">{EXPLORER.structuresLabel}</h4>
        <ul className="flex flex-col border-t border-rule">
          {condition.structures.map((structure) => (
            <li key={structure}>
              <button
                type="button"
                onClick={() => onSelect(structure)}
                className="flex w-full items-center justify-between gap-4 border-b border-rule py-3 text-left text-body-s text-ink hover:text-oxblood focus-visible:outline-offset-[-2px]">
                {STRUCTURES[structure].name}
                <span aria-hidden="true" className="text-ink-soft">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="label self-start text-ink underline decoration-rule underline-offset-4 hover:decoration-oxblood">
        {EXPLORER.clear}
      </button>
    </>
  );
}
