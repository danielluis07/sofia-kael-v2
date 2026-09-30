// The Explorer's deep links (ADR 0003 "URL, deep links and history"):
// `?structure=<id>#brain-explorer` and `?condition=<id>#brain-explorer`.
// Pure string in, string out; the store and `history` live in components/explorer.
import { SECTIONS, sectionHref } from "@/content/site";
import type { Focus } from "@/lib/brain/explorer-state";
import { isStructureId } from "@/lib/brain/structures";

export const STRUCTURE_PARAM = "structure";
export const CONDITION_PARAM = "condition";

const EXPLORER_HASH = sectionHref(SECTIONS[2].id);

export type UrlFocus = {
  focus: Focus;
  /** The URL names a Structure that doesn't exist: drop it from the URL, silently. */
  stale: boolean;
};

/** Reads the Focus a URL's query string asks for. */
export function parseFocus(search: string): UrlFocus {
  const id = new URLSearchParams(search).get(STRUCTURE_PARAM);
  if (id === null) return { focus: { kind: "none" }, stale: false };
  if (!isStructureId(id)) return { focus: { kind: "none" }, stale: true };
  return { focus: { kind: "structure", id }, stale: false };
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
