import { describe, expect, test } from "bun:test";
import { CORTEX_STRUCTURES, STRUCTURE_IDS, layerOf } from "./structures";
import {
  calloutStructure,
  deriveView,
  explorerReducer,
  focusedStructures,
  initialExplorerState,
  type ExplorerAction,
  type ExplorerState,
  type StructureView,
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

describe("focusCondition", () => {
  test("focuses the Condition, turns Isolate on and frames its Structures", () => {
    const state = run({ type: "focusCondition", id: "migraine" });
    expect(state.focus).toEqual({ kind: "condition", id: "migraine" });
    expect(state.isolate).toBe(true);
    expect(state.camera).toEqual({ intent: "frame", seq: 1 });
    expect(state.touched).toBe(true);
  });

  test("replaces a Structure focus: Focus is exclusive", () => {
    const state = run({ type: "select", id: "insula" }, { type: "focusCondition", id: "ataxia" });
    expect(state.focus).toEqual({ kind: "condition", id: "ataxia" });
  });

  test("Isolate may be turned off, which keeps the Condition's Structures tinted", () => {
    const state = run({ type: "focusCondition", id: "vertigo" }, { type: "toggleIsolate" });
    expect(state.isolate).toBe(false);
    expect(state.focus).toEqual({ kind: "condition", id: "vertigo" });
    const { structures } = deriveView(state);
    expect(STRUCTURE_IDS.filter((id) => structures[id].look === "oxblood")).toEqual(["pons", "medulla-oblongata", "cerebellum"]);
    expect(STRUCTURE_IDS.filter((id) => structures[id].look === "ghost")).toEqual([]);
  });
});

describe("select inside a Condition focus", () => {
  test("one of its Structures keeps the Condition as `via`, and the isolation moves to it", () => {
    const state = run({ type: "focusCondition", id: "vertigo" }, { type: "select", id: "pons" });
    expect(state.focus).toEqual({ kind: "structure", id: "pons", via: "vertigo" });
    expect(state.isolate).toBe(true);
    expect(focusedStructures(state.focus)).toEqual(["pons"]);
    expect(state.camera).toEqual({ intent: "frame", seq: 2 });
  });

  test("a Structure outside the Condition drops `via`", () => {
    const state = run({ type: "focusCondition", id: "vertigo" }, { type: "select", id: "hippocampus" });
    expect(state.focus).toEqual({ kind: "structure", id: "hippocampus" });
  });

  test("`via` carries between that Condition's Structures, and survives re-selecting", () => {
    const within = run({ type: "focusCondition", id: "vertigo" }, { type: "select", id: "pons" }, { type: "select", id: "cerebellum" });
    expect(within.focus).toEqual({ kind: "structure", id: "cerebellum", via: "vertigo" });
    expect(explorerReducer(within, { type: "select", id: "cerebellum" }).focus).toEqual(within.focus);
    expect(explorerReducer(within, { type: "select", id: "thalamus" }).focus).toEqual({ kind: "structure", id: "thalamus" });
  });

  test("the back link returns to the Condition focus, isolated again", () => {
    const state = run(
      { type: "focusCondition", id: "vertigo" },
      { type: "select", id: "pons" },
      { type: "toggleIsolate" },
      { type: "focusCondition", id: "vertigo" },
    );
    expect(state.focus).toEqual({ kind: "condition", id: "vertigo" });
    expect(state.isolate).toBe(true);
  });
});

describe("toggleIsolate", () => {
  test("does nothing without a Focus", () => {
    expect(explorerReducer(initialExplorerState, { type: "toggleIsolate" })).toBe(initialExplorerState);
  });

  test("toggles with a Structure focused, and counts as an interaction", () => {
    const focused: ExplorerState = { ...run({ type: "select", id: "pons" }), touched: false };
    const on = explorerReducer(focused, { type: "toggleIsolate" });
    expect(on.isolate).toBe(true);
    expect(on.touched).toBe(true);
    expect(explorerReducer(on, { type: "toggleIsolate" }).isolate).toBe(false);
  });

  test("follows the Focus: selecting another Structure moves the isolation to it", () => {
    const state = run({ type: "select", id: "pons" }, { type: "toggleIsolate" }, { type: "select", id: "thalamus" });
    expect(state.isolate).toBe(true);
    expect(deriveView(state).structures.thalamus.look).toBe("oxblood");
    expect(deriveView(state).structures.pons.look).toBe("ghost");
  });

  test("never moves the camera", () => {
    const focused = run({ type: "select", id: "pons" });
    expect(explorerReducer(focused, { type: "toggleIsolate" }).camera).toBe(focused.camera);
  });

  test("clearing the Focus turns it off", () => {
    expect(run({ type: "focusCondition", id: "migraine" }, { type: "clearFocus" }).isolate).toBe(false);
  });
});

describe("reset", () => {
  const tooled: ExplorerState = {
    ...run({ type: "focusCondition", id: "migraine" }, { type: "hover", id: "pons" }),
    xray: true,
    split: true,
    slice: { on: true, axis: "sagittal", mm: -22 },
  };

  test("returns focus, Isolate and every tool to the initial state, Slice to Coronal 0 mm", () => {
    const state = explorerReducer(tooled, { type: "reset" });
    expect(state.focus).toEqual({ kind: "none" });
    expect(state.isolate).toBe(false);
    expect(state.xray).toBe(false);
    expect(state.split).toBe(false);
    expect(state.slice).toEqual({ on: false, axis: "coronal", mm: 0 });
  });

  test("sends the camera home", () => {
    expect(explorerReducer(tooled, { type: "reset" }).camera).toEqual({ intent: "home", seq: tooled.camera.seq + 1 });
  });

  test("`touched` stays true, even when Reset is the first interaction", () => {
    expect(explorerReducer(tooled, { type: "reset" }).touched).toBe(true);
    expect(explorerReducer(initialExplorerState, { type: "reset" }).touched).toBe(true);
  });

  test("leaves the pointer's hover alone", () => {
    expect(explorerReducer(tooled, { type: "reset" }).hovered).toBe("pons");
  });
});

describe("restore (Back and Forward)", () => {
  test("brings back a history entry's Focus and Isolate exactly, `via` included, and frames it", () => {
    const current = run({ type: "focusCondition", id: "vertigo" });
    const state = explorerReducer(current, {
      type: "restore",
      focus: { kind: "structure", id: "pons", via: "vertigo" },
      isolate: false,
    });
    expect(state.focus).toEqual({ kind: "structure", id: "pons", via: "vertigo" });
    expect(state.isolate).toBe(false);
    expect(state.camera).toEqual({ intent: "frame", seq: current.camera.seq + 1 });
  });

  test("an entry without a Focus clears it", () => {
    const state = explorerReducer(run({ type: "focusCondition", id: "vertigo" }), {
      type: "restore",
      focus: { kind: "none" },
      isolate: false,
    });
    expect(state.focus).toEqual({ kind: "none" });
    expect(state.isolate).toBe(false);
  });

  test("the same Focus doesn't move the camera; the same Focus and Isolate change nothing", () => {
    const current = run({ type: "select", id: "pons" });
    const isolated = explorerReducer(current, { type: "restore", focus: { kind: "structure", id: "pons" }, isolate: true });
    expect(isolated.isolate).toBe(true);
    expect(isolated.camera).toBe(current.camera);
    expect(explorerReducer(current, { type: "restore", focus: { kind: "structure", id: "pons" }, isolate: false })).toBe(current);
  });
});

describe("deriveView rule 2: Isolate", () => {
  test("everything outside a Structure focus is ghost, uncapped and not pickable", () => {
    const { structures } = deriveView(run({ type: "select", id: "thalamus" }, { type: "toggleIsolate" }));
    expect(structures.thalamus).toEqual({ look: "oxblood", cap: true, pickable: true });
    for (const id of STRUCTURE_IDS.filter((id) => id !== "thalamus")) {
      expect(structures[id]).toEqual({ look: "ghost", cap: false, pickable: false });
    }
  });

  test("a Condition focus ghosts everything but its Structures", () => {
    const { structures } = deriveView(run({ type: "focusCondition", id: "parkinsons-disease" }));
    expect(STRUCTURE_IDS.filter((id) => structures[id].look !== "ghost")).toEqual(["basal-ganglia", "substantia-nigra"]);
  });

  test("an Isolate flag without a Focus ghosts nothing", () => {
    const { structures } = deriveView({ ...initialExplorerState, isolate: true });
    for (const id of STRUCTURE_IDS) expect(structures[id].look).toBe("porcelain");
  });

  test("the camera frames all of a Condition's Structures", () => {
    expect(deriveView(run({ type: "focusCondition", id: "essential-tremor" })).camera.frame).toEqual(["cerebellum", "thalamus"]);
  });
});

describe("toggleXray", () => {
  test("toggles, and counts as an interaction", () => {
    const on = run({ type: "toggleXray" });
    expect(on.xray).toBe(true);
    expect(on.touched).toBe(true);
    expect(explorerReducer(on, { type: "toggleXray" }).xray).toBe(false);
  });

  test("works without a Focus, never moves the camera and leaves the Focus alone", () => {
    const focused = run({ type: "focusCondition", id: "migraine" });
    const state = explorerReducer(focused, { type: "toggleXray" });
    expect(state.camera).toBe(focused.camera);
    expect(state).toEqual({ ...focused, xray: true });
  });

  test("survives clearing the Focus; Reset turns it off", () => {
    const state = run({ type: "select", id: "pons" }, { type: "toggleXray" }, { type: "clearFocus" });
    expect(state.xray).toBe(true);
    expect(explorerReducer(state, { type: "reset" }).xray).toBe(false);
  });
});

describe("deriveView rule 3: X-ray", () => {
  const FROST: StructureView = { look: "frost", cap: false, pickable: false };

  test("the eight cortical Structures are frosted, uncapped and not pickable; deep Structures stay porcelain", () => {
    const { structures } = deriveView(run({ type: "toggleXray" }));
    for (const id of CORTEX_STRUCTURES) expect(structures[id]).toEqual(FROST);
    for (const id of STRUCTURE_IDS.filter((id) => layerOf(id) === "deep")) {
      expect(structures[id]).toEqual({ look: "porcelain", cap: true, pickable: true });
    }
  });

  test("a focused cortical Structure stays opaque oxblood", () => {
    const { structures } = deriveView(run({ type: "toggleXray" }, { type: "select", id: "insula" }));
    expect(structures.insula).toEqual({ look: "oxblood", cap: true, pickable: true });
    expect(structures["frontal-lobe"]).toEqual(FROST);
  });

  test("a Condition focus keeps its cortex oxblood through the frost", () => {
    const { structures } = deriveView(run({ type: "focusCondition", id: "migraine" }, { type: "toggleIsolate" }, { type: "toggleXray" }));
    expect(STRUCTURE_IDS.filter((id) => structures[id].look === "oxblood")).toEqual(["occipital-lobe", "thalamus", "pons"]);
    expect(structures["temporal-lobe"]).toEqual(FROST);
    expect(structures.cerebellum.look).toBe("porcelain");
  });

  test("Isolate wins over X-ray: the rest of the cortex is ghost, not frost", () => {
    const { structures } = deriveView(run({ type: "select", id: "thalamus" }, { type: "toggleIsolate" }, { type: "toggleXray" }));
    expect(structures.thalamus.look).toBe("oxblood");
    for (const id of STRUCTURE_IDS.filter((id) => id !== "thalamus")) expect(structures[id].look).toBe("ghost");
  });

  test("an Isolate flag without a Focus leaves X-ray in charge", () => {
    const { structures } = deriveView({ ...initialExplorerState, isolate: true, xray: true });
    expect(structures["parietal-lobe"]).toEqual(FROST);
    expect(structures.hippocampus.look).toBe("porcelain");
  });

  test("the cortex stays reachable through the Structure index, but a frosted one gets no callout", () => {
    const xray = run({ type: "toggleXray" });
    expect(calloutStructure(explorerReducer(xray, { type: "hover", id: "frontal-lobe" }))).toBeNull();
    expect(calloutStructure(explorerReducer(xray, { type: "hover", id: "thalamus" }))).toBe("thalamus");
    const selected = explorerReducer(xray, { type: "select", id: "frontal-lobe" });
    expect(selected.focus).toEqual({ kind: "structure", id: "frontal-lobe" });
    expect(deriveView(selected).structures["frontal-lobe"].pickable).toBe(true);
  });
});

describe("toggleSplit", () => {
  test("toggles, and counts as an interaction", () => {
    const on = run({ type: "toggleSplit" });
    expect(on.split).toBe(true);
    expect(on.touched).toBe(true);
    expect(explorerReducer(on, { type: "toggleSplit" }).split).toBe(false);
  });

  test("turning it on requests the medial view, without a Focus and with one", () => {
    expect(run({ type: "toggleSplit" }).camera).toEqual({ intent: "medial", seq: 1 });
    const focused = run({ type: "select", id: "corpus-callosum" });
    const state = explorerReducer(focused, { type: "toggleSplit" });
    expect(state.camera).toEqual({ intent: "medial", seq: focused.camera.seq + 1 });
    expect(state.focus).toEqual(focused.focus);
  });

  test("turning it off never moves the camera", () => {
    const on = run({ type: "toggleSplit" });
    expect(explorerReducer(on, { type: "toggleSplit" }).camera).toBe(on.camera);
  });

  test("a Focus set while split frames its Structures, and the latest request wins", () => {
    const state = run({ type: "toggleSplit" }, { type: "focusCondition", id: "migraine" });
    expect(state.split).toBe(true);
    expect(deriveView(state).camera).toEqual({ intent: "frame", seq: 2, frame: ["occipital-lobe", "thalamus", "pons"] });
  });

  test("combines with X-ray, Isolate and a Focus without changing their looks", () => {
    const whole = run({ type: "select", id: "thalamus" }, { type: "toggleIsolate" }, { type: "toggleXray" });
    const split = explorerReducer(whole, { type: "toggleSplit" });
    expect(split).toEqual({ ...whole, split: true, camera: { intent: "medial", seq: whole.camera.seq + 1 } });
    expect(deriveView(split).structures).toEqual(deriveView(whole).structures);
  });

  test("survives clearing the Focus; Reset turns it off and eases home", () => {
    const state = run({ type: "select", id: "pons" }, { type: "toggleSplit" }, { type: "clearFocus" });
    expect(state.split).toBe(true);
    expect(state.camera.intent).toBe("medial");
    const reset = explorerReducer(state, { type: "reset" });
    expect(reset.split).toBe(false);
    expect(reset.camera).toEqual({ intent: "home", seq: state.camera.seq + 1 });
  });
});

describe("calloutStructure", () => {
  test("names the hovered Structure", () => {
    expect(calloutStructure(initialExplorerState)).toBeNull();
    expect(calloutStructure(run({ type: "hover", id: "pons" }))).toBe("pons");
  });

  test("a ghost never gets one, even from the Structure index", () => {
    const isolated = run({ type: "focusCondition", id: "ataxia" });
    expect(calloutStructure(explorerReducer(isolated, { type: "hover", id: "pons" }))).toBeNull();
    expect(calloutStructure(explorerReducer(isolated, { type: "hover", id: "cerebellum" }))).toBe("cerebellum");
  });
});
