// Slice's state (ADR 0003): an axis and a position in anatomical RAS millimetres
// (+x right, +y anterior, +z superior). lib/brain/slice-plane.ts maps it onto
// the model. No prose here: axis names live in content/.

export const SLICE_AXES = ["sagittal", "coronal", "axial"] as const;
export type SliceAxis = (typeof SLICE_AXES)[number];

/**
 * The slider's range on each axis: the brain's bounds, in whole millimetres
 * inside them. A test keeps it in sync with the curated GLB.
 */
export const SLICE_RANGE: Readonly<Record<SliceAxis, { min: number; max: number }>> = {
  sagittal: { min: -68, max: 68 },
  coronal: { min: -90, max: 90 },
  axial: { min: -80, max: 80 },
};

/** A position on `axis`, rounded to a whole millimetre and kept inside the brain. */
export function clampSliceMm(axis: SliceAxis, mm: number): number {
  const { min, max } = SLICE_RANGE[axis];
  const whole = Math.round(mm);
  // -0 would print as "−0".
  return Math.min(max, Math.max(min, whole)) || 0;
}
