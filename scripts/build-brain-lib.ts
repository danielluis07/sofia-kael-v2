import earcut from "earcut";

/** An indexed triangle mesh: xyz positions in metres and triangle indices. */
export type Mesh = { positions: Float32Array<ArrayBuffer>; indices: Uint32Array<ArrayBuffer> };

export const EMPTY_MESH: Mesh = { positions: new Float32Array(), indices: new Uint32Array() };

export function triangleCount(mesh: Mesh): number {
  return mesh.indices.length / 3;
}

/**
 * Merges vertices closer than `tolerance` (metres) and drops the triangles that
 * collapse. Positions are hashed onto a grid and the 27 neighbouring cells are
 * searched, so no pair within tolerance is missed at a cell border.
 */
export function weld(mesh: Mesh, tolerance: number): Mesh {
  const { positions, indices } = mesh;
  const cells = new Map<string, number[]>();
  const remap = new Uint32Array(positions.length / 3);
  const out: number[] = [];
  const tol2 = tolerance * tolerance;

  for (let i = 0; i < remap.length; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const cx = Math.floor(x / tolerance), cy = Math.floor(y / tolerance), cz = Math.floor(z / tolerance);
    let found = -1;
    search: for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          for (const j of cells.get(`${cx + dx},${cy + dy},${cz + dz}`) ?? []) {
            const ex = out[j * 3] - x, ey = out[j * 3 + 1] - y, ez = out[j * 3 + 2] - z;
            if (ex * ex + ey * ey + ez * ez <= tol2) {
              found = j;
              break search;
            }
          }
        }
    if (found < 0) {
      found = out.length / 3;
      out.push(x, y, z);
      const key = `${cx},${cy},${cz}`;
      const cell = cells.get(key);
      if (cell) cell.push(found);
      else cells.set(key, [found]);
    }
    remap[i] = found;
  }

  const tris: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    const a = remap[indices[t]], b = remap[indices[t + 1]], c = remap[indices[t + 2]];
    if (a !== b && b !== c && c !== a) tris.push(a, b, c);
  }
  return { positions: new Float32Array(out), indices: new Uint32Array(tris) };
}

/** Clamps every vertex onto its side of x = 0 (left is +X). */
export function clampToSide(mesh: Mesh, side: "left" | "right"): { mesh: Mesh; clamped: number } {
  const positions = mesh.positions.slice();
  let clamped = 0;
  for (let i = 0; i < positions.length; i += 3) {
    if (side === "left" ? positions[i] < 0 : positions[i] > 0) {
      positions[i] = 0;
      clamped++;
    }
  }
  return { mesh: { positions, indices: mesh.indices }, clamped };
}

/** Reflects the mesh across x = 0, reversing the winding so it still faces out. */
export function mirrorX(mesh: Mesh): Mesh {
  const positions = mesh.positions.slice();
  for (let i = 0; i < positions.length; i += 3) positions[i] = -positions[i];
  const indices = mesh.indices.slice();
  for (let t = 0; t < indices.length; t += 3) [indices[t + 1], indices[t + 2]] = [indices[t + 2], indices[t + 1]];
  return { positions, indices };
}

export function translate(mesh: Mesh, offset: readonly [number, number, number]): Mesh {
  const positions = mesh.positions.slice();
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += offset[0];
    positions[i + 1] += offset[1];
    positions[i + 2] += offset[2];
  }
  return { positions, indices: mesh.indices };
}

export function mergeMeshes(meshes: readonly Mesh[]): Mesh {
  const positions = new Float32Array(meshes.reduce((n, m) => n + m.positions.length, 0));
  const indices = new Uint32Array(meshes.reduce((n, m) => n + m.indices.length, 0));
  let p = 0, i = 0;
  for (const m of meshes) {
    positions.set(m.positions, p);
    const base = p / 3;
    for (let k = 0; k < m.indices.length; k++) indices[i + k] = m.indices[k] + base;
    p += m.positions.length;
    i += m.indices.length;
  }
  return { positions, indices };
}

export type Bounds = { min: [number, number, number]; max: [number, number, number] };

export function boundsOf(meshes: readonly Mesh[]): Bounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const { positions } of meshes)
    for (let i = 0; i < positions.length; i += 3)
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], positions[i + k]);
        max[k] = Math.max(max[k], positions[i + k]);
      }
  return { min, max };
}

/** Smooth, area-weighted vertex normals. */
export function vertexNormals(mesh: Mesh): Float32Array<ArrayBuffer> {
  const { positions: p, indices } = mesh;
  const n = new Float32Array(p.length);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) {
      n[v] += nx;
      n[v + 1] += ny;
      n[v + 2] += nz;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const len = Math.hypot(n[i], n[i + 1], n[i + 2]);
    if (len > 0) {
      n[i] /= len;
      n[i + 1] /= len;
      n[i + 2] /= len;
    } else n[i + 1] = 1;
  }
  return n;
}

export type MidlineHalf = {
  /** The part of the surface on this side of x = 0. */
  surface: Mesh;
  /** The flat fill of the cut face at x = 0, facing away from the half. */
  cap: Mesh;
  /** Cut loops that did not close on their own (open upstream meshes) and were joined end to end. */
  forcedLoops: number;
};

/**
 * Cuts a mesh at x = 0 and keeps one side (left is +X), filling the cut face.
 * Vertices exactly on the plane count as left, so the two halves share their cut
 * edges exactly and their caps are the same polygons.
 */
export function cutAtMidline(mesh: Mesh, side: "left" | "right"): MidlineHalf {
  const { positions: p, indices } = mesh;
  const vertexCount = p.length / 3;
  const inside = (v: number) => (side === "left" ? p[v * 3] >= 0 : p[v * 3] < 0);

  const out: number[] = Array.from(p);
  const keptVertex = new Int32Array(vertexCount).fill(-1);
  const crossing = new Map<string, number>();
  const tris: number[] = [];
  const segments: [number, number][] = [];

  const vertex = (v: number) => {
    if (keptVertex[v] < 0) keptVertex[v] = v;
    return v;
  };
  // Where edge a–b crosses x = 0, shared by both triangles on the edge.
  const cross = (a: number, b: number) => {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    let id = crossing.get(key);
    if (id === undefined) {
      const xa = p[a * 3], xb = p[b * 3];
      const t = xa === xb ? 0 : xa / (xa - xb);
      id = out.length / 3;
      out.push(0, p[a * 3 + 1] + t * (p[b * 3 + 1] - p[a * 3 + 1]), p[a * 3 + 2] + t * (p[b * 3 + 2] - p[a * 3 + 2]));
      crossing.set(key, id);
    }
    return id;
  };

  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    const inCount = tri.filter(inside).length;
    if (inCount === 3) tris.push(vertex(tri[0]), vertex(tri[1]), vertex(tri[2]));
    if (inCount === 0 || inCount === 3) continue;
    // Rotate so the lone vertex (inside when 1 is in, outside when 2 are) comes first.
    const lone = inCount === 1;
    const r = tri.findIndex((v) => inside(v) === lone);
    const [a, b, c] = [tri[r], tri[(r + 1) % 3], tri[(r + 2) % 3]];
    if (lone) {
      const pab = cross(a, b), pca = cross(c, a);
      tris.push(vertex(a), pab, pca);
      segments.push([pab, pca]);
    } else {
      // a is out, b and c are in: polygon b, c, P(ca), P(ab).
      const pab = cross(a, b), pca = cross(c, a);
      tris.push(vertex(b), vertex(c), pca, vertex(b), pca, pab);
      segments.push([pca, pab]);
    }
  }

  const surface = weld({ positions: new Float32Array(out), indices: new Uint32Array(tris) }, 1e-7);
  const { cap, forcedLoops } = fillCut(out, segments, side);
  return { surface: compact(surface), cap, forcedLoops };
}

/** Drops vertices no triangle uses. */
function compact(mesh: Mesh): Mesh {
  const map = new Int32Array(mesh.positions.length / 3).fill(-1);
  const positions: number[] = [];
  const indices = new Uint32Array(mesh.indices.length);
  mesh.indices.forEach((v, i) => {
    if (map[v] < 0) {
      map[v] = positions.length / 3;
      positions.push(mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]);
    }
    indices[i] = map[v];
  });
  return { positions: new Float32Array(positions), indices };
}

/** Chains the cut segments into loops and triangulates them in the (z, y) plane, nesting holes by containment. */
function fillCut(points: number[], segments: [number, number][], side: "left" | "right") {
  const yz = (id: number): [number, number] => [points[id * 3 + 2], points[id * 3 + 1]];

  const from = new Map<number, number[]>();
  segments.forEach(([a], i) => from.set(a, [...(from.get(a) ?? []), i]));
  const used = new Uint8Array(segments.length);
  const closed: number[][] = [];
  const open: number[][] = [];
  for (let s = 0; s < segments.length; s++) {
    if (used[s]) continue;
    const chain = [segments[s][0]];
    let cur = s;
    for (;;) {
      used[cur] = 1;
      const end = segments[cur][1];
      if (end === chain[0]) {
        closed.push(chain);
        break;
      }
      chain.push(end);
      const next = (from.get(end) ?? []).find((i) => !used[i]);
      if (next === undefined) {
        open.push(chain);
        break;
      }
      cur = next;
    }
  }

  // Join open chains end to nearest start until each closes.
  let forcedLoops = 0;
  while (open.length) {
    let chain = open.pop()!;
    for (;;) {
      const [ez, ey] = yz(chain.at(-1)!);
      const dist = (id: number) => Math.hypot(yz(id)[0] - ez, yz(id)[1] - ey);
      let best = -1;
      let bestD = dist(chain[0]);
      open.forEach((c, i) => {
        const d = dist(c[0]);
        if (d < bestD) [best, bestD] = [i, d];
      });
      if (best < 0) break;
      chain = chain.concat(open.splice(best, 1)[0]);
    }
    closed.push(chain);
    forcedLoops++;
  }

  const loops = closed.filter((l) => l.length >= 3).map((l) => l.map(yz));
  const depth = loops.map((loop, i) => loops.filter((other, j) => j !== i && contains(other, loop[0])).length);
  const positions: number[] = [];
  const tris: number[] = [];
  loops.forEach((outer, i) => {
    if (depth[i] % 2) return;
    const holes = loops.filter((h, j) => depth[j] === depth[i] + 1 && contains(outer, h[0]));
    const flat = [outer, ...holes].flat(2);
    const holeStarts: number[] = [];
    let n = outer.length;
    for (const h of holes) {
      holeStarts.push(n);
      n += h.length;
    }
    const base = positions.length / 3;
    for (let k = 0; k < flat.length; k += 2) positions.push(0, flat[k + 1], flat[k]);
    const local = earcut(flat, holeStarts, 2);
    for (let k = 0; k < local.length; k += 3) {
      const [a, b, c] = [local[k], local[k + 1], local[k + 2]];
      // Normal x = (b−a) × (c−a) in (y, z). The left half's cap faces −X, the right's +X.
      const ay = flat[a * 2 + 1], az = flat[a * 2];
      const nx = (flat[b * 2 + 1] - ay) * (flat[c * 2] - az) - (flat[b * 2] - az) * (flat[c * 2 + 1] - ay);
      const flip = side === "left" ? nx > 0 : nx < 0;
      tris.push(base + a, base + (flip ? c : b), base + (flip ? b : c));
    }
  });
  return { cap: { positions: new Float32Array(positions), indices: new Uint32Array(tris) }, forcedLoops };
}

function contains(loop: [number, number][], [px, py]: [number, number]): boolean {
  let inside = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const [xi, yi] = loop[i], [xj, yj] = loop[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Boundary edges (used by one triangle) after welding at `tolerance`: 0 means the mesh is closed. */
export function openEdges(mesh: Mesh, tolerance = 1e-7): number {
  const { indices } = weld(mesh, tolerance);
  const count = new Map<string, number>();
  for (let t = 0; t < indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = indices[t + k], b = indices[t + ((k + 1) % 3)];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      count.set(key, (count.get(key) ?? 0) + 1);
    }
  return [...count.values()].filter((c) => c === 1).length;
}
