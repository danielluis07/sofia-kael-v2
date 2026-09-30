import { describe, expect, test } from "bun:test";
import { SLICE_AXES, SLICE_RANGE, clampSliceMm } from "./slice";

describe("clampSliceMm", () => {
  test("rounds to a whole millimetre", () => {
    expect(clampSliceMm("coronal", -22.4)).toBe(-22);
    expect(clampSliceMm("coronal", 7.6)).toBe(8);
  });

  test("keeps the plane inside the brain's bounds for its axis", () => {
    for (const axis of SLICE_AXES) {
      expect(clampSliceMm(axis, 1000)).toBe(SLICE_RANGE[axis].max);
      expect(clampSliceMm(axis, -1000)).toBe(SLICE_RANGE[axis].min);
    }
    expect(clampSliceMm("sagittal", 80)).toBe(68);
    expect(clampSliceMm("coronal", 80)).toBe(80);
  });

  test("never returns −0", () => {
    expect(Object.is(clampSliceMm("axial", -0.2), 0)).toBe(true);
  });
});
