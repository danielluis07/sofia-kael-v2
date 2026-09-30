import { describe, expect, test } from "bun:test";
import { FOV, homeDistance } from "./framing";

// The curated GLB's bounds, in metres.
const SIZE = [0.138, 0.16, 0.18] as const;
const tan = Math.tan(((FOV / 2) * Math.PI) / 180);

/** Share of the stage height the specimen's height takes at a distance. */
const heightShare = (distance: number) => SIZE[1] / 2 / (distance * tan);

describe("homeDistance", () => {
  test("on a wide stage, height decides: the specimen fills about 62% of it", () => {
    expect(heightShare(homeDistance(SIZE, 16 / 9))).toBeCloseTo(0.62, 2);
    expect(homeDistance(SIZE, 3)).toBe(homeDistance(SIZE, 16 / 9));
  });

  test("on a portrait stage, width decides and the camera backs off", () => {
    const phone = homeDistance(SIZE, 375 / 740);
    expect(phone).toBeGreaterThan(homeDistance(SIZE, 16 / 9));
    expect(heightShare(phone)).toBeLessThan(0.62);
  });
});
