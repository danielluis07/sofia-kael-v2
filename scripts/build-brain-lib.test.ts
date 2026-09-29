import { describe, expect, test } from "bun:test";
import {
  boundsOf,
  clampToSide,
  cutAtMidline,
  mergeMeshes,
  mirrorX,
  openEdges,
  triangleCount,
  vertexNormals,
  weld,
  type Mesh,
} from "./build-brain-lib";

/** A closed, outward-facing box, split into unshared faces (24 vertices) like an unwelded upstream mesh. */
function box(min: [number, number, number], max: [number, number, number]): Mesh {
  const c = (i: number): [number, number, number] => [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]];
  const faces = [
    [0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5],
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const f of faces) {
    const base = positions.length / 3;
    for (const v of f) positions.push(...c(v));
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

/** Signed volume by the divergence theorem: positive when every face points out. */
function volume({ positions: p, indices }: Mesh): number {
  let v = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t] * 3, indices[t + 1] * 3, indices[t + 2] * 3];
    v += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
  }
  return v;
}

describe("weld", () => {
  test("closes a box whose faces don't share vertices", () => {
    const b = box([-1, -1, -1], [1, 1, 1]);
    expect(b.positions.length / 3).toBe(24);
    const welded = weld(b, 1e-6);
    expect(welded.positions.length / 3).toBe(8);
    expect(openEdges(welded)).toBe(0);
  });

  test("merges within tolerance only and drops collapsed triangles", () => {
    const mesh: Mesh = {
      positions: new Float32Array([0, 0, 0, 0.00005, 0, 0, 1, 0, 0, 0, 1, 0]),
      indices: new Uint32Array([0, 1, 3, 0, 2, 3]),
    };
    expect(triangleCount(weld(mesh, 1e-4))).toBe(1);
    expect(triangleCount(weld(mesh, 1e-5))).toBe(2);
  });
});

describe("cutAtMidline", () => {
  const whole = weld(box([-2, -1, -1], [2, 1, 1]), 1e-6);

  for (const side of ["left", "right"] as const) {
    test(`keeps the ${side} half closed, outward-facing and at the right volume`, () => {
      const { surface, cap, forcedLoops } = cutAtMidline(whole, side);
      expect(forcedLoops).toBe(0);
      const closedHalf = mergeMeshes([surface, cap]);
      expect(openEdges(closedHalf, 1e-6)).toBe(0);
      expect(volume(closedHalf)).toBeCloseTo(8, 5);
      const { min, max } = boundsOf([surface]);
      if (side === "left") expect(min[0]).toBe(0);
      else expect(max[0]).toBe(0);
    });
  }

  test("caps face away from their half", () => {
    const n = vertexNormals(cutAtMidline(whole, "left").cap);
    for (let i = 0; i < n.length; i += 3) expect(n[i]).toBeCloseTo(-1, 5);
  });

  test("fills a hollow cut with a hole", () => {
    const outer = weld(box([-2, -2, -2], [2, 2, 2]), 1e-6);
    const inner = weld(box([-1, -1, -1], [1, 1, 1]), 1e-6);
    for (let t = 0; t < inner.indices.length; t += 3) inner.indices.subarray(t + 1, t + 3).reverse(); // face inwards
    const shell = mergeMeshes([outer, inner]);
    const { surface, cap } = cutAtMidline(shell, "right");
    expect(volume(mergeMeshes([surface, cap]))).toBeCloseTo(32 - 4, 5);
  });
});

describe("mirrorX and clampToSide", () => {
  test("mirroring keeps a mesh outward-facing", () => {
    expect(volume(mirrorX(box([0, 0, 0], [1, 2, 3])))).toBeCloseTo(6, 5);
  });

  test("clamping moves only vertices past the midline", () => {
    const { mesh, clamped } = clampToSide(box([-0.1, 0, 0], [1, 1, 1]), "left");
    expect(clamped).toBe(12);
    expect(boundsOf([mesh]).min[0]).toBe(0);
  });
});
