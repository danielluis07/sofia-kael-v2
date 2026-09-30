// The Explorer's deep links (ADR 0003 "URL, deep links and history"):
// `?structure=<id>#brain-explorer` and `?condition=<id>#brain-explorer`.
// Pure string in, string out; the store and `history` live in components/explorer.
import { conditionRowId, isConditionId, type ConditionId } from "@/content/conditions";
import { SECTIONS, sectionHref } from "@/content/site";
import type { Focus } from "@/lib/brain/explorer-state";
import { isStructureId } from "@/lib/brain/structures";

export const STRUCTURE_PARAM = "structure";
export const CONDITION_PARAM = "condition";

const EXPLORER_HASH = sectionHref(SECTIONS[2].id);
const ROW_HASH = /^#condition-(.+)$/;

export type UrlFocus = {
  focus: Focus;
  /** The URL has a param the Focus doesn't account for (an unknown id, or a `structure` a `condition` beat): drop it, silently. */
  stale: boolean;
};

/** Reads the Focus a URL's query string asks for. `condition` wins over `structure`. */
export function parseFocus(search: string): UrlFocus {
  const params = new URLSearchParams(search);
  const condition = params.get(CONDITION_PARAM);
  const structure = params.get(STRUCTURE_PARAM);
  if (condition !== null && isConditionId(condition)) {
    return { focus: { kind: "condition", id: condition }, stale: structure !== null };
  }
  if (structure !== null && isStructureId(structure)) {
    return { focus: { kind: "structure", id: structure }, stale: condition !== null };
  }
  return { focus: { kind: "none" }, stale: condition !== null || structure !== null };
}

/**
 * The same-document URL (path, query and hash) that shares `focus`. Other
 * params stay put. A Focus lands on the Explorer; clearing keeps the hash.
 * `via` never enters the URL, and tool state never does either.
 */
export function serializeFocus(href: string, focus: Focus): string {
  const url = new URL(href);
  url.searchParams.delete(STRUCTURE_PARAM);
  url.searchParams.delete(CONDITION_PARAM);
  if (focus.kind !== "none") {
    url.searchParams.set(focus.kind === "structure" ? STRUCTURE_PARAM : CONDITION_PARAM, focus.id);
    url.hash = EXPLORER_HASH;
  }
  return url.pathname + url.search + url.hash;
}

/** "See it in the brain →" and the Structure panel's back link: the Condition focus, as a link that works without JS. */
export function conditionFocusHref(id: ConditionId): string {
  return `?${CONDITION_PARAM}=${id}${EXPLORER_HASH}`;
}

/** A Condition chip: the Condition's row in the Conditions section. */
export function conditionRowHref(id: ConditionId): string {
  return `#${conditionRowId(id)}`;
}

/** Marks the links the Explorer intercepts: "See it in the brain →" and the Condition chips (ADR 0005). */
export const JUMP_ATTRIBUTE = "data-explorer-jump";

/** On the panel's heading, which takes keyboard focus when a jump or a panel row changes what the panel shows. */
export const PANEL_TITLE_ATTRIBUTE = "data-panel-title";

/** A cross-section jump: into the Explorer with a Focus, or out to a Condition's row. */
export type Jump = { kind: "focus"; focus: Focus } | { kind: "row"; id: ConditionId };

/**
 * What a clicked link's resolved `href` jumps to, or null to leave the click
 * to the browser (another page, an unknown id, or anything else).
 */
export function parseJump(href: string, current: string): Jump | null {
  const url = new URL(href, current);
  const here = new URL(current);
  if (url.origin !== here.origin || url.pathname !== here.pathname) return null;
  const row = ROW_HASH.exec(url.hash)?.[1];
  if (row !== undefined) return isConditionId(row) ? { kind: "row", id: row } : null;
  if (url.hash !== EXPLORER_HASH) return null;
  const { focus } = parseFocus(url.search);
  return focus.kind === "none" ? null : { kind: "focus", focus };
}

/**
 * The URL pushed for a jump to a Condition's row. The query stays, so Back and
 * a reload both keep the Focus the Explorer holds while the Visitor is away.
 */
export function rowJumpUrl(current: string, id: ConditionId): string {
  const url = new URL(current);
  url.hash = conditionRowHref(id);
  return url.pathname + url.search + url.hash;
}

/** What the Explorer keeps in each history entry it writes, so Back restores it exactly (`via` included). */
export type HistorySnapshot = { focus: Focus; isolate: boolean };

export const HISTORY_KEY = "explorer";

/** A history entry's snapshot, or null if it has none (or not a valid one: history state outlives deploys). */
export function readSnapshot(state: unknown): HistorySnapshot | null {
  const snapshot = (state as Record<string, unknown> | null)?.[HISTORY_KEY] as Partial<HistorySnapshot> | undefined;
  if (!snapshot || typeof snapshot.isolate !== "boolean") return null;
  const focus = snapshot.focus as { kind?: unknown; id?: unknown; via?: unknown } | undefined;
  switch (focus?.kind) {
    case "none":
      return { focus: { kind: "none" }, isolate: false };
    case "condition":
      return typeof focus.id === "string" && isConditionId(focus.id)
        ? { focus: { kind: "condition", id: focus.id }, isolate: snapshot.isolate }
        : null;
    case "structure": {
      if (typeof focus.id !== "string" || !isStructureId(focus.id)) return null;
      const via = typeof focus.via === "string" && isConditionId(focus.via) ? focus.via : undefined;
      return { focus: via ? { kind: "structure", id: focus.id, via } : { kind: "structure", id: focus.id }, isolate: snapshot.isolate };
    }
    default:
      return null;
  }
}

/**
 * The `data` for `pushState` and `replaceState`. It carries only the snapshot:
 * Next.js copies its own router state in and syncs its URL, which it skips for
 * data that already holds that state.
 */
export function snapshotState(snapshot: HistorySnapshot): Record<string, unknown> {
  return { [HISTORY_KEY]: snapshot };
}
