import { describe, expect, test } from "bun:test";
import { explorerReducer, initialExplorerState, type ExplorerAction, type ExplorerState } from "./explorer-state";

const run = (...actions: ExplorerAction[]): ExplorerState => actions.reduce(explorerReducer, initialExplorerState);

describe("initial state", () => {
  test("no Focus, every tool off, Slice Coronal at 0 mm, camera home, untouched", () => {
    expect(initialExplorerState).toEqual({
      focus: { kind: "none" },
      isolate: false,
      xray: false,
      split: false,
      slice: { on: false, axis: "coronal", mm: 0 },
      hovered: null,
      camera: { intent: "home", seq: 0 },
      touched: false,
    });
  });
});

describe("touched", () => {
  test("an orbit drag sets it", () => {
    expect(run({ type: "orbit" }).touched).toBe(true);
  });

  test("a zoom sets it", () => {
    expect(run({ type: "zoom" }).touched).toBe(true);
  });

  test("hover doesn't", () => {
    const state = run({ type: "hover", id: "thalamus" });
    expect(state.hovered).toBe("thalamus");
    expect(state.touched).toBe(false);
  });

  test("stays set: nothing in this slice clears it", () => {
    expect(run({ type: "zoom" }, { type: "hover", id: "pons" }, { type: "hover", id: null }).touched).toBe(true);
  });

  test("gestures touch nothing else", () => {
    expect(run({ type: "orbit" }, { type: "zoom" })).toEqual({ ...initialExplorerState, touched: true });
  });
});

describe("no-op actions return the same state, so the store doesn't re-render", () => {
  test("orbiting again once touched", () => {
    const touched = run({ type: "orbit" });
    expect(explorerReducer(touched, { type: "orbit" })).toBe(touched);
    expect(explorerReducer(touched, { type: "zoom" })).toBe(touched);
  });

  test("hovering the Structure already hovered", () => {
    const hovered = run({ type: "hover", id: "pons" });
    expect(explorerReducer(hovered, { type: "hover", id: "pons" })).toBe(hovered);
  });
});
