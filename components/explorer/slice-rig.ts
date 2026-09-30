// Slice's scene objects (#5, #6): per-Structure-side stencil caps, the hairline
// `--oxblood` frame once per hemisphere, and optional three-mesh-bvh contours.
// BrainStage drives them from `deriveView`; the rules live in lib/brain (ADR 0003).
import * as THREE from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import type { SliceAxis } from "@/lib/brain/slice";
import { CAP_ORDER, crossedSides, slicePlane } from "@/lib/brain/slice-plane";
import { SIDES, type PartId, type Side } from "@/lib/brain/structures";

/** Caps, stencil passes, contours and the frame render on this layer, which the contact shadow's camera ignores (#6). */
export const SLICE_LAYER = 1;

/** A cut face's fill: `--porcelain-cut`, the lighter white matter inside the cortical ribbon, or the Focus in `--oxblood-deep`. */
export type CapTone = "cut" | "white" | "focus";

export type SliceColors = Readonly<Record<CapTone | "frame" | "contour", THREE.Color>>;

type SlicedPart = {
  part: PartId;
  side: Side;
  mesh: THREE.Mesh;
  /**
   * Every face the side's plane keeps flips the stencil, so it's left odd
   * exactly where a ray enters the closed mesh through the cut.
   */
  stencil: THREE.Mesh;
  /** A quad on the plane that fills where the stencil is left non-zero: the cut face. */
  cap: THREE.Mesh;
  contour: Contour | null;
  /** The part's bounds in its half's own space. */
  box: THREE.Box3;
};

export type SliceRig = {
  /**
   * World-space clip plane per hemisphere: the anatomical plane carried along
   * with its half, so it means the same position while split. Every look
   * material clips by its side's plane all the time; with Slice off it sits
   * out of reach, so toggling never swaps a shader.
   */
  planes: Readonly<Record<Side, THREE.Plane>>;
  /** The rig's own materials: the stencil passes (clipped per side), the caps and the lines. */
  materials: readonly THREE.Material[];
  /**
   * Places the plane (null: Slice off) and gives each part its cut face in
   * `tone`, or none. Runs whenever the view changes.
   */
  set: (slice: SlicePlane | null, tone: (part: PartId) => CapTone | null) => void;
  /** Carries each half's plane and frame along with it while Split slides. Runs every frame. */
  follow: () => void;
  dispose: () => void;
};

type SlicePlane = { axis: SliceAxis; mm: number };

/** Frame margin round the brain's section, metres. */
const FRAME_MARGIN = 0.006;
/** Contours sit this far off the plane toward the Visitor, metres, so they draw over the caps. */
const CONTOUR_LIFT = 0.0002;
/** How far a cap reaches past its part's bounds, metres. */
const CAP_MARGIN = 0.002;
/** Where the plane goes while Slice is off: far past the brain, so it keeps everything. */
const OPEN = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);

/**
 * One pass per part flips the stencil on each face, front or back: #5's
 * increment and decrement passes in one draw, for the same parity.
 */
function stencilMaterial(plane: THREE.Plane): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    colorWrite: false,
    depthWrite: false,
    depthTest: false,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.InvertStencilOp,
    stencilZFail: THREE.InvertStencilOp,
    stencilZPass: THREE.InvertStencilOp,
    clippingPlanes: [plane],
  });
}

function capMaterial(color: THREE.Color): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilRef: 0,
    stencilFunc: THREE.NotEqualStencilFunc,
    // Drawing the cap resets the stencil, ready for the next Structure.
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  });
}

function onSliceLayer<T extends THREE.Object3D>(object: T, renderOrder: number): T {
  object.layers.set(SLICE_LAYER);
  object.renderOrder = renderOrder;
  object.visible = false;
  object.raycast = () => {};
  return object;
}

/** Where the plane cuts a mesh: line segments from its BVH, rebuilt whenever the plane or the capped set changes. */
class Contour {
  readonly lines: THREE.LineSegments;
  private readonly bvh: MeshBVH;
  private positions = new Float32Array(3 * 4096);

  constructor(mesh: THREE.Mesh, material: THREE.LineBasicMaterial) {
    this.bvh = new MeshBVH(mesh.geometry);
    // Picking gets the BVH too.
    mesh.geometry.boundsTree = this.bvh;
    mesh.raycast = acceleratedRaycast;
    this.lines = new THREE.LineSegments(this.geometry(), material);
    this.lines.frustumCulled = false;
  }

  private geometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setDrawRange(0, 0);
    return geometry;
  }

  /** `plane` is in the mesh's own space. */
  update(plane: THREE.Plane) {
    const lift = plane.normal.clone().multiplyScalar(-CONTOUR_LIFT);
    let count = 0;
    /** Where the plane crosses the edge p → q, whose ends lie at signed distances dp and dq. */
    const push = (p: THREE.Vector3, q: THREE.Vector3, dp: number, dq: number) => {
      if (3 * (count + 1) > this.positions.length) this.grow();
      const t = dp / (dp - dq);
      this.positions[3 * count] = p.x + (q.x - p.x) * t + lift.x;
      this.positions[3 * count + 1] = p.y + (q.y - p.y) * t + lift.y;
      this.positions[3 * count + 2] = p.z + (q.z - p.z) * t + lift.z;
      count++;
    };
    this.bvh.shapecast({
      intersectsBounds: (box) => plane.intersectsBox(box),
      intersectsTriangle: ({ a, b, c }) => {
        const [da, db, dc] = [plane.distanceToPoint(a), plane.distanceToPoint(b), plane.distanceToPoint(c)];
        // The vertex alone on its side of the plane, and its two edges cross it. A vertex on the plane counts as kept.
        const alone = (da < 0) !== (db < 0) ? ((da < 0) === (dc < 0) ? "b" : "a") : (da < 0) !== (dc < 0) ? "c" : null;
        if (alone === "a") {
          push(a, b, da, db);
          push(a, c, da, dc);
        } else if (alone === "b") {
          push(b, a, db, da);
          push(b, c, db, dc);
        } else if (alone === "c") {
          push(c, a, dc, da);
          push(c, b, dc, db);
        }
        return false;
      },
    });
    // Upload only the segments written this time, not the whole buffer.
    const attribute = this.lines.geometry.getAttribute("position") as THREE.BufferAttribute;
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, 3 * count);
    attribute.needsUpdate = true;
    this.lines.geometry.setDrawRange(0, count);
  }

  private grow() {
    const positions = new Float32Array(this.positions.length * 2);
    positions.set(this.positions);
    this.positions = positions;
    // A buffer can't change size in place: swap in a new geometry.
    this.lines.geometry.dispose();
    this.lines.geometry = this.geometry();
  }

  dispose() {
    this.lines.geometry.dispose();
  }
}

/**
 * Builds the rig for `meshes` (every Structure-side and the white matter),
 * each already in its half's group. `contours` is the flag the mobile fallback
 * ladder (ADR 0006) can turn off.
 */
export function buildSliceRig(
  meshes: readonly { mesh: THREE.Mesh; part: PartId; side: Side }[],
  halves: Readonly<Record<Side, THREE.Group>>,
  colors: SliceColors,
  contours: boolean,
): SliceRig {
  const planes = { left: OPEN.clone(), right: OPEN.clone() };
  const stencils = { left: stencilMaterial(planes.left), right: stencilMaterial(planes.right) };
  const caps: Record<CapTone, THREE.MeshStandardMaterial> = {
    cut: capMaterial(colors.cut),
    white: capMaterial(colors.white),
    focus: capMaterial(colors.focus),
  };
  const frameMaterial = new THREE.LineBasicMaterial({ color: colors.frame });
  const contourMaterial = new THREE.LineBasicMaterial({ color: colors.contour, transparent: true, opacity: 0.55, depthWrite: false });
  /** A unit quad, scaled to each part. */
  const quad = new THREE.PlaneGeometry(1, 1);

  const bounds = { left: new THREE.Box3(), right: new THREE.Box3() };
  const sliced: SlicedPart[] = meshes.map(({ mesh, part, side }) => {
    bounds[side].expandByObject(mesh);
    // Outer to inner: each part's stencil pass, then its cap, then the next part's.
    const order = 1 + 2 * CAP_ORDER.indexOf(part);
    const stencil = onSliceLayer(new THREE.Mesh(mesh.geometry, stencils[side]), order);
    stencil.matrixAutoUpdate = false;
    stencil.matrix.copy(mesh.matrix);
    const cap = onSliceLayer(new THREE.Mesh(quad, caps.cut), order + 1);
    const contour = contours ? new Contour(mesh, contourMaterial) : null;
    if (contour) {
      onSliceLayer(contour.lines, 1000);
      contour.lines.matrixAutoUpdate = false;
      contour.lines.matrix.copy(mesh.matrix);
    }
    halves[side].add(stencil, cap, ...(contour ? [contour.lines] : []));
    const box = new THREE.Box3().setFromBufferAttribute(mesh.geometry.getAttribute("position") as THREE.BufferAttribute).applyMatrix4(mesh.matrix);
    return { part, side, mesh, box, stencil, cap, contour };
  });

  /** Four edges round the section in a half; filled in by `placeFrames`. */
  const frame = (side: Side) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 8), 3).setUsage(THREE.DynamicDrawUsage));
    const lines = onSliceLayer(new THREE.LineSegments(geometry, frameMaterial), 1001);
    lines.frustumCulled = false;
    halves[side].add(lines);
    return lines;
  };
  const frames = { left: frame("left"), right: frame("right") };

  /** The plane in model space, which is also each half's own space. */
  const model = OPEN.clone();
  let current: SlicePlane | null = null;
  /** Each part's fill, as last set, so a view change that only moves the hover costs nothing. */
  let fills = "";
  /** The left half's X when the frames were last placed. */
  let placedOffset = 0;

  /** Rebuilds the contours of the parts with a cut face. */
  const recut = () => {
    const local = new THREE.Plane();
    const inverse = new THREE.Matrix4();
    for (const { mesh, contour, cap } of sliced) {
      if (contour && cap.visible) contour.update(local.copy(model).applyMatrix4(inverse.copy(mesh.matrix).invert()));
    }
  };

  /** The frame round the section in each half the plane crosses, in the half's own space. */
  const placeFrames = (slice: SlicePlane, offset: number) => {
    const crossed = crossedSides(slice.axis, slice.mm);
    const on = model.coplanarPoint(new THREE.Vector3());
    const m = FRAME_MARGIN;
    for (const side of SIDES) {
      const frame = frames[side];
      frame.visible = crossed.includes(side);
      if (!frame.visible) continue;
      const box = bounds[side];
      let points: [number, number, number][];
      if (slice.axis === "sagittal") {
        const [y0, y1, z0, z1] = [box.min.y - m, box.max.y + m, box.min.z - m, box.max.z + m];
        const corners: [number, number, number][] = [[on.x, y1, z0], [on.x, y1, z1], [on.x, y0, z1], [on.x, y0, z0]];
        points = corners.flatMap((corner, k) => [corner, corners[(k + 1) % 4]]);
      } else {
        // The halves' frames meet at the midline while whole; apart, each closes its own medial edge.
        const medial = (side === "left" ? -1 : 1) * Math.min(m, offset);
        const lateral = side === "left" ? box.max.x + m : box.min.x - m;
        const [v0, v1] = slice.axis === "coronal" ? [box.min.y - m, box.max.y + m] : [box.min.z - m, box.max.z + m];
        const point = (u: number, v: number): [number, number, number] =>
          slice.axis === "coronal" ? [u, v, on.z] : [u, on.y, v];
        // Top, lateral, bottom, then the medial edge last, so the draw range can leave it out.
        points = [
          point(medial, v1), point(lateral, v1),
          point(lateral, v1), point(lateral, v0),
          point(lateral, v0), point(medial, v0),
          point(medial, v0), point(medial, v1),
        ];
      }
      const attribute = frame.geometry.getAttribute("position") as THREE.BufferAttribute;
      points.forEach((point, k) => attribute.setXYZ(k, ...point));
      attribute.needsUpdate = true;
      frame.geometry.setDrawRange(0, slice.axis === "sagittal" || offset > 0 ? 8 : 6);
    }
  };

  const materials = [stencils.left, stencils.right, ...Object.values(caps), frameMaterial, contourMaterial];

  return {
    planes,
    materials,
    set(slice, tone) {
      const moved = slice?.axis !== current?.axis || slice?.mm !== current?.mm;
      current = slice;
      if (moved) {
        if (slice) {
          const { normal, constant } = slicePlane(slice.axis, slice.mm);
          model.set(new THREE.Vector3(...normal), constant);
        } else model.copy(OPEN);
        // Each cap lies on the plane over its own part's bounds, no bigger: every
        // pixel it covers costs a stencil test. The plane is always axis-aligned.
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), model.normal);
        const size = new THREE.Vector3();
        for (const { cap, box } of sliced) {
          model.projectPoint(box.getCenter(cap.position), cap.position);
          cap.quaternion.copy(quaternion);
          const [x, y, z] = box.getSize(size).toArray();
          const across = model.normal.x !== 0 ? Math.max(y, z) : model.normal.y !== 0 ? Math.max(x, z) : Math.max(x, y);
          cap.scale.setScalar(across + 2 * CAP_MARGIN);
        }
      }
      // A part the plane misses has no cut face: it skips its stencil pass too.
      const next = sliced.map(({ part, box }) => (slice && model.intersectsBox(box) ? tone(part) : null));
      const key = next.join();
      const refilled = key !== fills;
      fills = key;
      sliced.forEach(({ stencil, cap, contour }, k) => {
        const fill = next[k];
        stencil.visible = fill !== null;
        cap.visible = fill !== null;
        if (fill) cap.material = caps[fill];
        if (contour) contour.lines.visible = fill !== null;
      });
      if (slice && (moved || refilled)) recut();
      this.follow();
      if (slice && moved) placeFrames(slice, placedOffset);
      if (!slice) for (const side of SIDES) frames[side].visible = false;
    },
    follow() {
      for (const side of SIDES) planes[side].copy(model).translate(halves[side].position);
      const offset = halves.left.position.x;
      if (offset === placedOffset) return;
      placedOffset = offset;
      if (current) placeFrames(current, offset);
    },
    dispose() {
      for (const material of materials) material.dispose();
      quad.dispose();
      for (const frame of Object.values(frames)) frame.geometry.dispose();
      for (const { contour } of sliced) contour?.dispose();
    },
  };
}
