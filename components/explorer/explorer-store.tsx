"use client";

import { createContext, use, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  explorerReducer,
  initialExplorerState,
  type ExplorerAction,
  type ExplorerState,
} from "@/lib/brain/explorer-state";

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
  return <ExplorerStoreContext value={store}>{children}</ExplorerStoreContext>;
}

function useStore(): ExplorerStore {
  const store = use(ExplorerStoreContext);
  if (!store) throw new Error("Explorer hooks need an <ExplorerProvider>");
  return store;
}

/** Re-renders only when the selected slice changes; keep selectors returning primitives or stable references. */
export function useExplorer<T>(selector: (state: ExplorerState) => T): T {
  const store = useStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(initialExplorerState),
  );
}

export function useExplorerDispatch(): ExplorerStore["dispatch"] {
  return useStore().dispatch;
}
