"use client";

import { useEffect } from "react";
import type { ExplorerStore } from "@/components/explorer/explorer-store";
import { conditionRowId } from "@/content/conditions";
import { SECTIONS } from "@/content/site";
import type { ExplorerAction, Focus } from "@/lib/brain/explorer-state";
import {
  JUMP_ATTRIBUTE,
  PANEL_TITLE_ATTRIBUTE,
  parseFocus,
  parseJump,
  readSnapshot,
  rowJumpUrl,
  serializeFocus,
  snapshotState,
  type HistorySnapshot,
  type Jump,
} from "@/lib/brain/explorer-url";

/** On `<html>` once the jump links are intercepted. */
const JUMPS_LIVE_ATTRIBUTE = "data-explorer-jumps";

/**
 * The URL and history both ways (ADR 0003 "URL, deep links and history").
 *
 * - On load, `?structure=` or `?condition=` is applied right away, before the
 *   GLB, and anything unknown is dropped from the URL.
 * - Selections inside the Explorer replace the URL, so it is always shareable
 *   without filling the history.
 * - Cross-section jumps push: "See it in the brain →" into the Explorer, a
 *   Condition chip out to its row. One delegated click listener intercepts them,
 *   so the Conditions section stays server markup (ADR 0005).
 * - Every entry the Explorer writes carries its Focus and Isolate, so Back and
 *   Forward bring them back exactly. Other entries fall back to their URL.
 */
export function useExplorerHistory(store: ExplorerStore) {
  useEffect(() => {
    const snapshot = (): HistorySnapshot => {
      const { focus, isolate } = store.getState();
      return { focus, isolate };
    };

    const { focus, stale } = parseFocus(location.search);
    const arrival = arrive(focus);
    if (arrival) store.dispatch(arrival);
    if (stale) history.replaceState(snapshotState(snapshot()), "", serializeFocus(location.href, store.getState().focus));

    let written = snapshot();
    /** Off while a jump or Back/Forward writes history itself. */
    let replacing = true;
    const unsubscribe = store.subscribe(() => {
      const next = snapshot();
      if (next.focus === written.focus && next.isolate === written.isolate) return;
      written = next;
      if (replacing) history.replaceState(snapshotState(next), "", serializeFocus(location.href, next.focus));
    });

    const jump = (target: Jump) => {
      // The entry being left keeps exactly what the Explorer shows now.
      history.replaceState(snapshotState(snapshot()), "");
      replacing = false;
      if (target.kind === "focus") {
        const action = arrive(target.focus);
        if (action) store.dispatch(action);
      }
      replacing = true;
      const url = target.kind === "focus" ? serializeFocus(location.href, store.getState().focus) : rowJumpUrl(location.href, target.id);
      // Like the browser's own links, a jump to where the Visitor already is adds no entry.
      const here = location.pathname + location.search + location.hash;
      (url === here ? history.replaceState : history.pushState).call(history, snapshotState(snapshot()), "", url);

      const destination = document.getElementById(target.kind === "focus" ? SECTIONS[2].id : conditionRowId(target.id));
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
      destination?.scrollIntoView({ behavior, block: "start" });
      // After React has rendered the panel the jump opened.
      requestAnimationFrame(() => {
        const heading =
          target.kind === "focus" ? destination?.querySelector<HTMLElement>(`[${PANEL_TITLE_ATTRIBUTE}]`) : destination;
        heading?.focus({ preventScroll: true });
      });
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>(`a[${JUMP_ATTRIBUTE}]`);
      const target = link && parseJump(link.href, location.href);
      if (!target) return;
      event.preventDefault();
      jump(target);
    };

    const onPopState = (event: PopStateEvent) => {
      const entry = readSnapshot(event.state) ?? fromUrl();
      replacing = false;
      store.dispatch({ type: "restore", ...entry });
      replacing = true;
    };

    document.addEventListener("click", onClick);
    addEventListener("popstate", onPopState);
    // Until now a jump link is a plain link, and the browser simply follows it.
    document.documentElement.setAttribute(JUMPS_LIVE_ATTRIBUTE, "");
    return () => {
      unsubscribe();
      document.removeEventListener("click", onClick);
      removeEventListener("popstate", onPopState);
      document.documentElement.removeAttribute(JUMPS_LIVE_ATTRIBUTE);
    };
  }, [store]);
}

/** A deep-link arrival: a Condition isolates its Structures, a Structure is selected. */
function arrive(focus: Focus): ExplorerAction | null {
  switch (focus.kind) {
    case "none":
      return null;
    case "structure":
      return { type: "select", id: focus.id };
    case "condition":
      return { type: "focusCondition", id: focus.id };
  }
}

/** An entry the Explorer never wrote (a nav anchor, the first load): its URL, as if arriving there. */
function fromUrl(): HistorySnapshot {
  const { focus } = parseFocus(location.search);
  return { focus, isolate: focus.kind === "condition" };
}
