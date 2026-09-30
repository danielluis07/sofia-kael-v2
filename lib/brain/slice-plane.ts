// Where Slice's plane sits in the scene: the model-space plane for an anatomical
// position, the hemispheres it crosses and the order the caps draw in. The
// renderer's half of lib/brain/slice.ts, kept apart so it stays in the 3D chunk.
import { CORTEX_STRUCTURES, WHITE_MATTER, type PartId, type Side } from "@/lib/brain/structures";
import type { SliceAxis } from "@/lib/brain/slice";

/**
 * The plane in model space, in metres, as three.js takes it: points where
 * `normal · p + constant ≥ 0` stay. The half kept is the one away from the home
 * view (three-quarter left, front, above), so the cut faces the Visitor:
 * sagittal keeps the right hemisphere, coronal the back, axial the bottom.
 */
export function slicePlane(axis: SliceAxis, mm: number): { normal: [number, number, number]; constant: number } {
  const m = mm / 1000;
  switch (axis) {
    // RAS x is the model's −X.
    case "sagittal":
      return { normal: [-1, 0, 0], constant: -m };
    case "coronal":
      return { normal: [0, 0, -1], constant: m };
    case "axial":
      return { normal: [0, -1, 0], constant: m };
  }
}

/**
 * The hemispheres the plane crosses, each of which gets its own `--oxblood`
 * frame while split (ADR 0003). A sagittal plane crosses one: negative x is the
 * left hemisphere. At 0 mm it lies on the midline, the left half is cut away,
 * and the frame sits on the right half's medial surface.
 */
export function crossedSides(axis: SliceAxis, mm: number): readonly Side[] {
  if (axis !== "sagittal") return ["left", "right"];
  return mm < 0 ? ["left"] : ["right"];
}

/**
 * The order Slice's caps draw in, outer to inner (#5), so a Structure nested in
 * another keeps its own section: each later cap covers the earlier ones where
 * they overlap. White matter first, so the cortex draws its ribbon round it.
 */
export const CAP_ORDER = [
  WHITE_MATTER,
  ...CORTEX_STRUCTURES,
  "corpus-callosum",
  "ventricles",
  "hippocampus",
  "cerebellum",
  "basal-ganglia",
  "thalamus",
  "hypothalamus",
  "amygdala",
  "midbrain",
  "pons",
  "medulla-oblongata",
  // Inside the midbrain.
  "substantia-nigra",
] as const satisfies readonly PartId[];
