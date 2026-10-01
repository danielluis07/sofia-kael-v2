// The Brain Explorer's whole state model (ADR 0003): one pure reducer the tool
// rail, the panel, the Structure index and the scene all read through the store.
import { conditionById, type ConditionId } from "@/content/conditions";
import { clampSliceMm, type SliceAxis } from "@/lib/brain/slice";
import { STRUCTURE_IDS, layerOf, type StructureId } from "@/lib/brain/structures";

export type { SliceAxis };

export type Focus =
  | { kind: "none" }
  | { kind: "structure"; id: StructureId; via?: ConditionId }
  | { kind: "condition"; id: ConditionId };

export type CameraIntent = "home" | "frame" | "medial";

export type ExplorerState = {
  focus: Focus;
  /** Only takes effect while focus is set. */
  isolate: boolean;
  xray: boolean;
  split: boolean;
  /** `mm` is the plane's anatomical (RAS) position on `axis`, kept while Slice is off. */
  slice: { on: boolean; axis: SliceAxis; mm: number };
  hovered: StructureId | null;
  /** `seq` increments on every requested move; the renderer owns the actual pose. */
  camera: { intent: CameraIntent; seq: number };
  /** The first interaction happened: the idle rotation and the first-use hint are gone for good. */
  touched: boolean;
};

export const initialExplorerState: ExplorerState = {
  focus: { kind: "none" },
  isolate: false,
  xray: false,
  split: false,
  slice: { on: false, axis: "coronal", mm: 0 },
  hovered: null,
  camera: { intent: "home", seq: 0 },
  touched: false,
};

export type ExplorerAction =
  /** The Visitor dragged the specimen round. */
  | { type: "orbit" }
  /** The Visitor zoomed by scroll or pinch. */
  | { type: "zoom" }
  /** Canvas pointer hover or keyboard focus in the Structure index; the latest source wins. */
  | { type: "hover"; id: StructureId | null }
  /** A hover source left `id`: clears the hover only if no other source has taken it since. */
  | { type: "unhover"; id: StructureId }
  /**
   * A canvas click or tap, the Structure index, a Condition panel row, or a
   * `?structure=` deep link. A Structure of the Condition it's reached through
   * keeps that Condition as `via`.
   */
  | { type: "select"; id: StructureId }
  /** "See it in the brain →", a `?condition=` deep link, or the Structure panel's "← <Condition>". */
  | { type: "focusCondition"; id: ConditionId }
  /** Esc, the panel's close control, or the Condition panel's "Clear". */
  | { type: "clearFocus" }
  /** The rail's or the Structure panel's Isolate. Does nothing without a Focus. */
  | { type: "toggleIsolate" }
  /** The rail's Slice. */
  | { type: "toggleSlice" }
  /** Slice's segmented control: the plane re-centres at 0 mm on the new axis. */
  | { type: "setSliceAxis"; axis: SliceAxis }
  /** Slice's slider, in millimetres: rounded, and kept inside the brain. */
  | { type: "setSliceMm"; mm: number }
  /** The rail's X-ray. */
  | { type: "toggleXray" }
  /** The rail's Split. */
  | { type: "toggleSplit" }
  /** The rail's Reset: everything back to the initial state, except `touched`. */
  | { type: "reset" }
  /** Back or Forward landed on a history entry: its Focus and Isolate come back. */
  | { type: "restore"; focus: Focus; isolate: boolean };

/** Returns `state` itself when nothing changed, so the store can skip notifying. */
export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case "orbit":
    case "zoom":
      return touch(state);
    case "hover":
      return state.hovered === action.id ? state : { ...state, hovered: action.id };
    case "unhover":
      return state.hovered === action.id ? { ...state, hovered: null } : state;
    case "select": {
      // Isolate carries over to the new Focus. Selecting again re-frames: the Visitor may have orbited away.
      const via = viaFor(state.focus, action.id);
      return {
        ...state,
        focus: via ? { kind: "structure", id: action.id, via } : { kind: "structure", id: action.id },
        camera: move(state, "frame"),
        touched: true,
      };
    }
    case "focusCondition":
      // Arriving at a Condition isolates its Structures.
      return {
        ...state,
        focus: { kind: "condition", id: action.id },
        isolate: true,
        camera: move(state, "frame"),
        touched: true,
      };
    case "clearFocus":
      // The camera stays where it is, and so do the tools.
      return state.focus.kind === "none" && !state.isolate
        ? state
        : { ...state, focus: { kind: "none" }, isolate: false };
    case "toggleIsolate":
      return state.focus.kind === "none" ? state : { ...state, isolate: !state.isolate, touched: true };
    case "toggleSlice":
      // Keeps its axis and position. Never moves the camera, and needs no Focus.
      return { ...state, slice: { ...state.slice, on: !state.slice.on }, touched: true };
    case "setSliceAxis":
      return state.slice.axis === action.axis
        ? state
        : { ...state, slice: { ...state.slice, axis: action.axis, mm: 0 }, touched: true };
    case "setSliceMm": {
      const mm = clampSliceMm(state.slice.axis, action.mm);
      return state.slice.mm === mm ? state : { ...state, slice: { ...state.slice, mm }, touched: true };
    }
    case "toggleXray":
      // Never moves the camera, and needs no Focus.
      return { ...state, xray: !state.xray, touched: true };
    case "toggleSplit":
      // Turning it on swings to the medial view; turning it off leaves the camera where it is.
      return state.split
        ? { ...state, split: false, touched: true }
        : { ...state, split: true, camera: move(state, "medial"), touched: true };
    case "reset":
      // The hover belongs to the pointer, not to a tool.
      return { ...initialExplorerState, hovered: state.hovered, camera: move(state, "home"), touched: true };
    case "restore": {
      if (action.focus.kind === "none") return explorerReducer(state, { type: "clearFocus" });
      const same = sameFocus(state.focus, action.focus);
      if (same && state.isolate === action.isolate) return state;
      return {
        ...state,
        focus: action.focus,
        isolate: action.isolate,
        // Only a Focus that changed moves the camera.
        camera: same ? state.camera : move(state, "frame"),
        touched: true,
      };
    }
  }
}

function touch(state: ExplorerState): ExplorerState {
  return state.touched ? state : { ...state, touched: true };
}

function move(state: ExplorerState, intent: CameraIntent): ExplorerState["camera"] {
  return { intent, seq: state.camera.seq + 1 };
}

/**
 * The Condition a newly selected Structure is reached through: the Condition
 * focus, or the focused Structure's own `via`, as long as the new Structure is
 * one of that Condition's.
 */
function viaFor(focus: Focus, id: StructureId): ConditionId | undefined {
  const condition = focus.kind === "condition" ? focus.id : focus.kind === "structure" ? focus.via : undefined;
  if (!condition) return undefined;
  return (conditionById(condition).structures as readonly StructureId[]).includes(id) ? condition : undefined;
}

export function sameFocus(a: Focus, b: Focus): boolean {
  if (a.kind === "none" || b.kind === "none") return a.kind === b.kind;
  if (a.kind === "structure" && b.kind === "structure") return a.id === b.id && a.via === b.via;
  return a.kind === b.kind && a.id === b.id;
}

/** The Structures the Focus highlights: the selected one, or the Condition's. */
export function focusedStructures(focus: Focus): readonly StructureId[] {
  switch (focus.kind) {
    case "none":
      return [];
    case "structure":
      return [focus.id];
    case "condition":
      return conditionById(focus.id).structures;
  }
}

/** A Structure-side's material treatment; `frost` is X-ray's translucent tissue. */
export type Look = "oxblood" | "tissue" | "ghost" | "frost";

export type StructureView = {
  look: Look;
  /** Gets a Slice cap where the plane cuts it. */
  cap: boolean;
  /** Canvas hover and clicks reach it. */
  pickable: boolean;
};

export type ExplorerView = {
  /** Keyed by Structure: a Structure's two sides always share a look, since a Focus is bilateral. */
  structures: Readonly<Record<StructureId, StructureView>>;
  /** The white-matter context mesh (ADR 0002): shown, and capped, only during Slice, and hidden under X-ray or Isolate. */
  whiteMatter: boolean;
  /** Slice's plane, which clips everything; null while Slice is off. Each Structure's `cap` decides whether its cut face is filled. */
  slice: { axis: SliceAxis; mm: number } | null;
  /** Where the camera should go. `frame` targets are the focused Structures, where they currently sit. */
  camera: ExplorerState["camera"] & { frame: readonly StructureId[] };
};

const FOCUSED: StructureView = { look: "oxblood", cap: true, pickable: true };
const GHOST: StructureView = { look: "ghost", cap: false, pickable: false };
const FROST: StructureView = { look: "frost", cap: false, pickable: false };
const TISSUE: StructureView = { look: "tissue", cap: true, pickable: true };

/**
 * What the scene renders (ADR 0003 "deriveView"). The first matching rule wins:
 * 1. in the Focus: oxblood, capped, pickable;
 * 2. Isolate is on: ghost, uncapped, not pickable;
 * 3. X-ray is on and it's cortex: frost, uncapped, not pickable, so clicks reach the deep Structures;
 * 4. otherwise: tissue, capped, pickable.
 */
export function deriveView(state: ExplorerState): ExplorerView {
  const focused = focusedStructures(state.focus);
  const structures = Object.fromEntries(
    STRUCTURE_IDS.map((id) => [id, structureView(state, focused, id)]),
  ) as Record<StructureId, StructureView>;
  const { on, axis, mm } = state.slice;
  const isolated = state.isolate && focused.length > 0;
  return {
    structures,
    // Its caps would bury the deep sections that X-ray and Isolate are there to show.
    whiteMatter: on && !state.xray && !isolated,
    slice: on ? { axis, mm } : null,
    camera: { ...state.camera, frame: focused },
  };
}

function structureView(state: ExplorerState, focused: readonly StructureId[], id: StructureId): StructureView {
  if (focused.includes(id)) return FOCUSED;
  // Isolate only takes effect while there is a Focus.
  if (state.isolate && focused.length > 0) return GHOST;
  if (state.xray && layerOf(id) === "cortex") return FROST;
  return TISSUE;
}

/** The Structure the hover callout names: the hovered one, unless it isn't pickable (a ghost or frosted cortex never gets one). */
export function calloutStructure(state: ExplorerState): StructureId | null {
  const { hovered } = state;
  return hovered && structureView(state, focusedStructures(state.focus), hovered).pickable ? hovered : null;
}
