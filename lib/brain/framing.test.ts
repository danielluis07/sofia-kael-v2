import { describe, expect, test } from "bun:test";
import { FOV, SPLIT_M, ZOOM_OUT, frameDistance, homeDistance, medialDirection } from "./framing";

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

describe("frameDistance", () => {
  /** A home distance the two cases below stay within, unclamped. */
  const HOME = 0.2;
  /** Share of the stage height a sphere of `radius` takes at a distance. */
  const sphereShare = (radius: number, distance: number) => radius / (distance * tan);

  test("on a wide stage, the Structure's bounding sphere fills three quarters of the height", () => {
    expect(sphereShare(0.04, frameDistance(0.04, 16 / 9, HOME))).toBeCloseTo(0.75, 5);
    expect(frameDistance(0.04, 3, HOME)).toBe(frameDistance(0.04, 16 / 9, HOME));
  });

  test("on a portrait stage, width decides and the camera backs off", () => {
    expect(frameDistance(0.04, 0.8, HOME)).toBeCloseTo(frameDistance(0.04, 1, HOME) * 1.25, 10);
  });

  test("a small deep Structure never pulls the camera much closer than home", () => {
    const home = homeDistance(SIZE, 16 / 9);
    expect(frameDistance(0.02, 16 / 9, home)).toBeCloseTo(home * 0.8, 10);
  });

  test("a large one never pushes it past the zoom-out limit", () => {
    const home = homeDistance(SIZE, 16 / 9);
    expect(frameDistance(1, 16 / 9, home)).toBeCloseTo(home * ZOOM_OUT, 10);
  });
});

describe("medialDirection", () => {
  test("a unit vector from the front, turned toward the near side and a little above", () => {
    for (const near of ["left", "right"] as const) {
      const [x, y, z] = medialDirection(near);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
      expect(Math.sign(x)).toBe(near === "left" ? 1 : -1);
      expect(y).toBeGreaterThan(0);
      expect(z).toBeGreaterThan(Math.abs(x));
    }
  });

  test("the sight line from the far half's medial surface clears the front of the near half", () => {
    // From the far medial surface at x = −SPLIT_M, the line reaches the near medial surface at x = +SPLIT_M
    // in front of the brain, so the near half never hides the far one's middle.
    const [x, , z] = medialDirection("left");
    expect(((2 * SPLIT_M) / x) * z).toBeGreaterThan(SIZE[2] / 2);
  });
});
