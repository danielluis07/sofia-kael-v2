import { describe, expect, test } from "bun:test";
import { STRUCTURE_IDS } from "./structures";
import {
  deriveView,
  explorerReducer,
  focusedStructures,
  initialExplorerState,
  type ExplorerAction,
  type ExplorerState,
} from "./explorer-state";

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

  test("a selection sets it, including a deep-link arrival", () => {
    expect(run({ type: "select", id: "pons" }).touched).toBe(true);
  });

  test("hover doesn't", () => {
    const state = run({ type: "hover", id: "thalamus" });
    expect(state.hovered).toBe("thalamus");
    expect(state.touched).toBe(false);
  });

  test("stays set: clearing the Focus doesn't clear it", () => {
    expect(run({ type: "zoom" }, { type: "hover", id: "pons" }, { type: "hover", id: null }).touched).toBe(true);
    expect(run({ type: "select", id: "pons" }, { type: "clearFocus" }).touched).toBe(true);
  });

  test("gestures touch nothing else", () => {
    expect(run({ type: "orbit" }, { type: "zoom" })).toEqual({ ...initialExplorerState, touched: true });
  });
});

describe("select", () => {
  test("focuses the whole Structure and frames it", () => {
    const state = run({ type: "select", id: "hippocampus" });
    expect(state.focus).toEqual({ kind: "structure", id: "hippocampus" });
    expect(state.camera).toEqual({ intent: "frame", seq: 1 });
  });

  test("replaces the Focus: selections never stack", () => {
    const state = run({ type: "select", id: "hippocampus" }, { type: "select", id: "pons" });
    expect(state.focus).toEqual({ kind: "structure", id: "pons" });
    expect(state.camera).toEqual({ intent: "frame", seq: 2 });
  });

  test("selecting the focused Structure again re-frames it", () => {
    const state = run({ type: "select", id: "pons" }, { type: "orbit" }, { type: "select", id: "pons" });
    expect(state.camera).toEqual({ intent: "frame", seq: 2 });
  });

  test("leaves the hover and the tools alone", () => {
    const hovered = run({ type: "hover", id: "amygdala" });
    const state = explorerReducer(hovered, { type: "select", id: "pons" });
    expect(state.hovered).toBe("amygdala");
    expect(state.isolate).toBe(false);
    expect(state.slice).toBe(hovered.slice);
  });
});

describe("clearFocus", () => {
  test("drops the Focus and turns Isolate off", () => {
    const isolated: ExplorerState = { ...run({ type: "select", id: "pons" }), isolate: true };
    const state = explorerReducer(isolated, { type: "clearFocus" });
    expect(state.focus).toEqual({ kind: "none" });
    expect(state.isolate).toBe(false);
  });

  test("never moves the camera, and leaves the tools where they are", () => {
    const tooled: ExplorerState = {
      ...run({ type: "select", id: "pons" }),
      xray: true,
      split: true,
      slice: { on: true, axis: "axial", mm: -12 },
    };
    const state = explorerReducer(tooled, { type: "clearFocus" });
    expect(state.camera).toBe(tooled.camera);
    expect(state).toEqual({ ...tooled, focus: { kind: "none" } });
  });
});

describe("hover: one Structure, latest source wins", () => {
  test("a new source replaces the hover", () => {
    expect(run({ type: "hover", id: "pons" }, { type: "hover", id: "thalamus" }).hovered).toBe("thalamus");
  });

  test("a source leaving its Structure clears the hover", () => {
    expect(run({ type: "hover", id: "pons" }, { type: "unhover", id: "pons" }).hovered).toBeNull();
  });

  test("a source leaving a Structure another source has since taken changes nothing", () => {
    // Canvas hovers the Pons, then the Structure index takes keyboard focus on the Thalamus.
    const state = run({ type: "hover", id: "pons" }, { type: "hover", id: "thalamus" });
    expect(explorerReducer(state, { type: "unhover", id: "pons" })).toBe(state);
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

  test("clearing with no Focus", () => {
    expect(explorerReducer(initialExplorerState, { type: "clearFocus" })).toBe(initialExplorerState);
  });

  test("unhovering with nothing hovered", () => {
    expect(explorerReducer(initialExplorerState, { type: "unhover", id: "pons" })).toBe(initialExplorerState);
  });
});

describe("focusedStructures", () => {
  test("none, the selected Structure, or the Condition's Structures", () => {
    expect(focusedStructures({ kind: "none" })).toEqual([]);
    expect(focusedStructures({ kind: "structure", id: "pons", via: "vertigo" })).toEqual(["pons"]);
    expect(focusedStructures({ kind: "condition", id: "parkinsons-disease" })).toEqual(["substantia-nigra", "basal-ganglia"]);
  });
});

describe("deriveView", () => {
  test("rule 4: with no Focus every Structure is porcelain, capped and pickable", () => {
    const { structures } = deriveView(initialExplorerState);
    expect(Object.keys(structures)).toEqual([...STRUCTURE_IDS]);
    for (const id of STRUCTURE_IDS) expect(structures[id]).toEqual({ look: "porcelain", cap: true, pickable: true });
  });

  test("rule 1: the selected Structure is oxblood, capped and pickable; the rest stay porcelain", () => {
    const { structures } = deriveView(run({ type: "select", id: "thalamus" }));
    expect(structures.thalamus).toEqual({ look: "oxblood", cap: true, pickable: true });
    for (const id of STRUCTURE_IDS.filter((id) => id !== "thalamus")) {
      expect(structures[id]).toEqual({ look: "porcelain", cap: true, pickable: true });
    }
  });

  test("rule 1: a Condition focus turns each of its Structures oxblood", () => {
    const { structures } = deriveView({ ...initialExplorerState, focus: { kind: "condition", id: "migraine" } });
    const oxblood = STRUCTURE_IDS.filter((id) => structures[id].look === "oxblood");
    expect(oxblood).toEqual(["occipital-lobe", "thalamus", "pons"]);
  });

  test("the camera frames the focused Structures, and only moves when its seq does", () => {
    expect(deriveView(initialExplorerState).camera).toEqual({ intent: "home", seq: 0, frame: [] });
    expect(deriveView(run({ type: "select", id: "pons" })).camera).toEqual({ intent: "frame", seq: 1, frame: ["pons"] });
    expect(deriveView(run({ type: "select", id: "pons" }, { type: "clearFocus" })).camera).toEqual({ intent: "frame", seq: 1, frame: [] });
  });

  test("hover changes no look", () => {
    expect(deriveView(run({ type: "hover", id: "pons" })).structures).toEqual(deriveView(initialExplorerState).structures);
  });
});
