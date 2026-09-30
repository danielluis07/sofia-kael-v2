// The Brain Explorer's whole state model (ADR 0003): one pure reducer the tool
// rail, the panel, the Structure index and the scene all read through the store.
import type { ConditionId } from "@/content/conditions";
import type { StructureId } from "@/lib/brain/structures";

export type Focus =
  | { kind: "none" }
  | { kind: "structure"; id: StructureId; via?: ConditionId }
  | { kind: "condition"; id: ConditionId };

export type SliceAxis = "sagittal" | "coronal" | "axial";

export type ExplorerState = {
  focus: Focus;
  /** Only takes effect while focus is set. */
  isolate: boolean;
  xray: boolean;
  split: boolean;
  slice: { on: boolean; axis: SliceAxis; mm: number };
  hovered: StructureId | null;
  camera: { intent: "home" | "frame" | "medial"; seq: number };
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
  /** Canvas pointer hover or keyboard focus in the Structure index; null when it leaves. */
  | { type: "hover"; id: StructureId | null };

/** Returns `state` itself when nothing changed, so the store can skip notifying. */
export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case "orbit":
    case "zoom":
      return touch(state);
    case "hover":
      return state.hovered === action.id ? state : { ...state, hovered: action.id };
  }
}

function touch(state: ExplorerState): ExplorerState {
  return state.touched ? state : { ...state, touched: true };
}
