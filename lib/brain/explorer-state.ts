// The Brain Explorer's whole state model (ADR 0003): one pure reducer the tool
// rail, the panel, the Structure index and the scene all read through the store.
import { CONDITIONS, type ConditionId } from "@/content/conditions";
import { STRUCTURE_IDS, type StructureId } from "@/lib/brain/structures";

export type Focus =
  | { kind: "none" }
  | { kind: "structure"; id: StructureId; via?: ConditionId }
  | { kind: "condition"; id: ConditionId };

export type SliceAxis = "sagittal" | "coronal" | "axial";

export type CameraIntent = "home" | "frame" | "medial";

export type ExplorerState = {
  focus: Focus;
  /** Only takes effect while focus is set. */
  isolate: boolean;
  xray: boolean;
  split: boolean;
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
  /** A canvas click or tap, the Structure index, or a `?structure=` deep link. */
  | { type: "select"; id: StructureId }
  /** Esc, the panel's close control, or the Condition panel's "Clear". */
  | { type: "clearFocus" };

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
    case "select":
      // Selecting again re-frames: the Visitor may have orbited away.
      return {
        ...state,
        focus: { kind: "structure", id: action.id },
        camera: move(state, "frame"),
        touched: true,
      };
    case "clearFocus":
      // The camera stays where it is, and so do the tools.
      return state.focus.kind === "none" && !state.isolate
        ? state
        : { ...state, focus: { kind: "none" }, isolate: false };
  }
}

function touch(state: ExplorerState): ExplorerState {
  return state.touched ? state : { ...state, touched: true };
}

function move(state: ExplorerState, intent: CameraIntent): ExplorerState["camera"] {
  return { intent, seq: state.camera.seq + 1 };
}

/** The Structures the Focus highlights: the selected one, or the Condition's. */
export function focusedStructures(focus: Focus): readonly StructureId[] {
  switch (focus.kind) {
    case "none":
      return [];
    case "structure":
      return [focus.id];
    case "condition":
      return CONDITIONS.find((condition) => condition.id === focus.id)?.structures ?? [];
  }
}

/** The look of a Structure-side, named after its DESIGN.md §2 token. */
export type Look = "oxblood" | "porcelain";

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
  /** Where the camera should go. `frame` targets are the focused Structures, where they currently sit. */
  camera: ExplorerState["camera"] & { frame: readonly StructureId[] };
};

const FOCUSED: StructureView = { look: "oxblood", cap: true, pickable: true };
const PORCELAIN: StructureView = { look: "porcelain", cap: true, pickable: true };

/**
 * What the scene renders (ADR 0003 "deriveView"). The first matching rule wins:
 * 1. in the Focus: oxblood, capped, pickable;
 * 4. otherwise: porcelain, capped, pickable.
 * Rules 2 (Isolate) and 3 (X-ray) arrive with their tools.
 */
export function deriveView(state: ExplorerState): ExplorerView {
  const focused = focusedStructures(state.focus);
  const structures = Object.fromEntries(
    STRUCTURE_IDS.map((id) => [id, focused.includes(id) ? FOCUSED : PORCELAIN]),
  ) as Record<StructureId, StructureView>;
  return { structures, camera: { ...state.camera, frame: focused } };
}
