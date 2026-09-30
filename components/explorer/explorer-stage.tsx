"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Gesture } from "@/components/explorer/brain-stage";
import { useExplorer, useExplorerDispatch } from "@/components/explorer/explorer-store";
import { SpecimenOutline } from "@/components/explorer/specimen-outline";
import { EXPLORER } from "@/content/site";
import { cn } from "@/lib/utils";

// `ssr: false` code-splits only from a client file (#2), which keeps the 3D chunk out of the initial route.
const BrainStage = dynamic(() => import("@/components/explorer/brain-stage"), { ssr: false });

/** idle: not near yet · loading: fetching the GLB · ready: first frame on screen · fallback: no WebGL2 or the load failed. */
type Phase = "idle" | "loading" | "ready" | "fallback";

/** How far ahead of the viewport the scene starts loading. */
const LOAD_AHEAD = "100% 0px";

/**
 * The live part of the stage: the specimen, its loading line drawing and
 * readout, and the first-use hint. Without WebGL2, or if the GLB fails, it
 * stays on the line drawing and says how to explore instead (ADR 0006).
 */
export function ExplorerStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [percent, setPercent] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const touched = useExplorer((state) => state.touched);
  const dispatch = useExplorerDispatch();
  const reducedMotion = useReducedMotion();
  const idle = !touched && !reducedMotion;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // The section approaches when it's within reach and the Visitor is scrolling
    // (or it's already on screen, e.g. a deep link). A page that merely loads with
    // the section within reach doesn't count: nobody asked for 2 MB yet.
    const seen = { near: false, onScreen: false, scrolled: false };
    const approach = () => {
      if (!seen.near || !(seen.scrolled || seen.onScreen)) return;
      near.disconnect();
      removeEventListener("scroll", onScroll);
      setPhase((phase) => (phase === "idle" ? (supportsWebGL2() ? "loading" : "fallback") : phase));
    };
    const onScroll = () => {
      seen.scrolled = true;
      approach();
    };
    const near = new IntersectionObserver(
      (entries) => {
        seen.near = entries.at(-1)?.isIntersecting ?? false;
        approach();
      },
      { rootMargin: LOAD_AHEAD },
    );
    const visible = new IntersectionObserver((entries) => {
      seen.onScreen = entries.at(-1)?.isIntersecting ?? false;
      setOnScreen(seen.onScreen);
      approach();
    });
    near.observe(stage);
    visible.observe(stage);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      near.disconnect();
      visible.disconnect();
      removeEventListener("scroll", onScroll);
    };
  }, []);

  const live = phase === "loading" || phase === "ready";
  const ready = phase === "ready";
  const fail = () => setPhase("fallback");

  return (
    <div ref={stageRef} data-specimen={phase} data-idle={idle ? "rotating" : "still"} className="absolute inset-0">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-(--dur-slow)",
          ready && "opacity-0",
        )}>
        <SpecimenOutline className="w-[min(80%,34rem)]" />
      </div>

      <div role="img" aria-label={EXPLORER.canvasDescription} className="absolute inset-0">
        {live ? (
          <SceneBoundary onError={fail}>
            <div
              className={cn(
                // Until the mobile slice's "Tap to explore", vertical swipes keep scrolling the page.
                "absolute inset-0 opacity-0 transition-opacity duration-(--dur-slow) [&_canvas]:touch-pan-y!",
                ready && "opacity-100",
              )}>
              <BrainStage
                active={onScreen}
                idle={idle}
                onProgress={setPercent}
                onReady={() => setPhase("ready")}
                onFail={fail}
                onGesture={(gesture: Gesture) => dispatch({ type: gesture })}
              />
            </div>
          </SceneBoundary>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-(--gutter) text-center">
        {live ? (
          <p
            data-testid="specimen-readout"
            aria-hidden={ready}
            className={cn("label text-ink tabular-nums transition-opacity duration-(--dur-slow)", ready && "opacity-0")}>
            {EXPLORER.loading} · {ready ? 100 : percent}%
          </p>
        ) : null}
        {phase === "fallback" ? <p className="max-w-md text-body-s text-ink">{EXPLORER.fallback}</p> : null}
      </div>

      <FirstUseHint shown={ready && !touched} />
    </div>
  );
}

/** The leader-line caption "Drag to rotate · Click a Structure" (DESIGN.md §6, §9). */
function FirstUseHint({ shown }: { shown: boolean }) {
  return (
    <p
      aria-hidden={!shown}
      className={cn(
        "label pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-ink transition-opacity duration-(--dur-slow)",
        !shown && "opacity-0",
      )}>
      <span className="size-2 rounded-full border-[1.5px] border-oxblood" />
      <span className="h-px w-8 bg-ink-soft" />
      {EXPLORER.hint}
    </p>
  );
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[explorer] the scene failed", error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}
