"use client";

import { createContext, use, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  deriveView,
  explorerReducer,
  initialExplorerState,
  type ExplorerAction,
  type ExplorerState,
  type ExplorerView,
} from "@/lib/brain/explorer-state";
import { parseFocus, serializeFocus } from "@/lib/brain/explorer-url";

/** The small external store around `explorerReducer` (ADR 0003). */
export type ExplorerStore = {
  getState: () => ExplorerState;
  dispatch: (action: ExplorerAction) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createExplorerStore(initial: ExplorerState = initialExplorerState): ExplorerStore {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = explorerReducer(state, action);
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const ExplorerStoreContext = createContext<ExplorerStore | null>(null);

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createExplorerStore);
  useFocusUrl(store);
  return <ExplorerStoreContext value={store}>{children}</ExplorerStoreContext>;
}

/**
 * `?structure=` both ways (ADR 0003). On load the URL is applied right away,
 * before the GLB, and an unknown id is dropped from it. From then on every
 * Focus change replaces the URL, so it is always shareable without filling the history.
 */
function useFocusUrl(store: ExplorerStore) {
  useEffect(() => {
    const { focus, stale } = parseFocus(location.search);
    if (focus.kind === "structure") store.dispatch({ type: "select", id: focus.id });
    else if (stale) history.replaceState(history.state, "", serializeFocus(location.href, focus));

    let written = store.getState().focus;
    return store.subscribe(() => {
      const { focus } = store.getState();
      if (focus === written) return;
      written = focus;
      history.replaceState(history.state, "", serializeFocus(location.href, focus));
    });
  }, [store]);
}

export function useExplorerStore(): ExplorerStore {
  const store = use(ExplorerStoreContext);
  if (!store) throw new Error("Explorer hooks need an <ExplorerProvider>");
  return store;
}

/** Re-renders only when the selected slice changes; keep selectors returning primitives or stable references. */
export function useExplorer<T>(selector: (state: ExplorerState) => T): T {
  const store = useExplorerStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(initialExplorerState),
  );
}

export function useExplorerDispatch(): ExplorerStore["dispatch"] {
  return useExplorerStore().dispatch;
}

/** `deriveView` of the current state: what the scene renders. */
export function useExplorerView(): ExplorerView {
  const state = useExplorer((state) => state);
  return useMemo(() => deriveView(state), [state]);
}
