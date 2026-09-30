import { describe, expect, test } from "bun:test";
import { sliceReadout } from "./slice-readout";

describe("sliceReadout", () => {
  test("names the axis and its RAS coordinate, with a true minus sign", () => {
    expect(sliceReadout("Coronal", "coronal", -22)).toBe("Coronal · y = −22 mm");
    expect(sliceReadout("Sagittal", "sagittal", 14)).toBe("Sagittal · x = 14 mm");
    expect(sliceReadout("Axial", "axial", 0)).toBe("Axial · z = 0 mm");
  });
});
