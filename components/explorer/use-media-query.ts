"use client";

import { useSyncExternalStore } from "react";

/** A media query's live match. The server, and hydration, assume `serverMatches`. */
export function useMediaQuery(query: string, serverMatches = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => serverMatches,
  );
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
