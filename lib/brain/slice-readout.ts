// Slice's mono readout (DESIGN.md §9), apart from lib/brain/slice.ts so it loads
// only with Slice's controls.
import type { SliceAxis } from "@/lib/brain/slice";

/** The RAS coordinate each axis's position reads in. */
export const SLICE_COORDINATE: Readonly<Record<SliceAxis, "x" | "y" | "z">> = {
  sagittal: "x",
  coronal: "y",
  axial: "z",
};

/** The mono readout, e.g. "Coronal · y = −22 mm", with a true minus sign. `name` is the axis's copy. */
export function sliceReadout(name: string, axis: SliceAxis, mm: number): string {
  const value = mm < 0 ? `−${-mm}` : `${mm}`;
  return `${name} · ${SLICE_COORDINATE[axis]} = ${value} mm`;
}
