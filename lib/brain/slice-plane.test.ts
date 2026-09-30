import { describe, expect, test } from "bun:test";
import { SLICE_AXES, SLICE_RANGE } from "./slice";
import { CAP_ORDER, crossedSides, slicePlane } from "./slice-plane";
import { CORTEX_STRUCTURES, STRUCTURE_IDS, WHITE_MATTER } from "./structures";

/** Whether the plane keeps a model-space point, in metres. */
const keeps = (plane: ReturnType<typeof slicePlane>, point: [number, number, number]) =>
  plane.normal.reduce((sum, n, k) => sum + n * point[k], plane.constant) >= 0;

describe("slicePlane: anatomical RAS onto the model (left is +X, front +Z, top +Y)", () => {
  test("sagittal x is the negated model x, and keeps the right hemisphere", () => {
    const plane = slicePlane("sagittal", -22);
    // x = −22 mm is 22 mm into the left hemisphere, at model +X.
    expect(keeps(plane, [0.021, 0, 0])).toBe(true);
    expect(keeps(plane, [0.023, 0, 0])).toBe(false);
    expect(keeps(plane, [-0.05, 0, 0])).toBe(true);
  });

  test("coronal y is the model's z, and keeps the back", () => {
    const plane = slicePlane("coronal", -22);
    expect(keeps(plane, [0, 0, -0.023])).toBe(true);
    expect(keeps(plane, [0, 0, -0.021])).toBe(false);
  });

  test("axial z is the model's y, and keeps the bottom", () => {
    const plane = slicePlane("axial", 30);
    expect(keeps(plane, [0, 0.029, 0])).toBe(true);
    expect(keeps(plane, [0, 0.031, 0])).toBe(false);
  });

  test("one end of each range keeps the whole brain, the other none of it", () => {
    // Just inside the corners of the brain's bounds, in model space.
    const corners: [number, number, number][] = [];
    for (const x of [-0.067, 0.067]) for (const y of [-0.079, 0.079]) for (const z of [-0.089, 0.089]) corners.push([x, y, z]);
    // Sagittal runs the other way: its min is the model's +X.
    const whole = { sagittal: SLICE_RANGE.sagittal.min, coronal: SLICE_RANGE.coronal.max, axial: SLICE_RANGE.axial.max };
    const none = { sagittal: SLICE_RANGE.sagittal.max, coronal: SLICE_RANGE.coronal.min, axial: SLICE_RANGE.axial.min };
    for (const axis of SLICE_AXES) {
      expect(corners.every((corner) => keeps(slicePlane(axis, whole[axis]), corner))).toBe(true);
      expect(corners.some((corner) => keeps(slicePlane(axis, none[axis]), corner))).toBe(false);
    }
  });
});

describe("crossedSides", () => {
  test("coronal and axial planes cross both hemispheres", () => {
    expect(crossedSides("coronal", -22)).toEqual(["left", "right"]);
    expect(crossedSides("axial", 40)).toEqual(["left", "right"]);
  });

  test("a sagittal plane crosses one: negative x is the left hemisphere", () => {
    expect(crossedSides("sagittal", -22)).toEqual(["left"]);
    expect(crossedSides("sagittal", 22)).toEqual(["right"]);
  });

  test("at the midline the frame sits on the right half, the one left standing", () => {
    expect(crossedSides("sagittal", 0)).toEqual(["right"]);
  });
});

describe("CAP_ORDER", () => {
  test("caps every part once: white matter, then the cortex, then the deep Structures", () => {
    expect<string[]>([...CAP_ORDER].sort()).toEqual([...STRUCTURE_IDS, WHITE_MATTER].sort());
    expect(CAP_ORDER[0]).toBe(WHITE_MATTER);
    expect(CAP_ORDER.slice(1, 1 + CORTEX_STRUCTURES.length)).toEqual([...CORTEX_STRUCTURES]);
  });

  test("the substantia nigra caps after the midbrain it sits in", () => {
    expect(CAP_ORDER.indexOf("substantia-nigra")).toBeGreaterThan(CAP_ORDER.indexOf("midbrain"));
  });
});
