// Builds public/models/brain.glb from the pinned upstream Z-Anatomy GLB (ADR 0002).
// Run with `bun run build:brain`; commit the output. Deploys never fetch upstream.
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { Document, NodeIO, type Node as GltfNode } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import {
  STRUCTURE_IDS,
  SIDES,
  WHITE_MATTER,
  meshName,
  roleOf,
  type PartId,
  type Side,
  type UpstreamExtras,
} from "@/lib/brain/structures";
import {
  boundsOf,
  clampToSide,
  cutAtMidline,
  mergeMeshes,
  mirrorX,
  translate,
  triangleCount,
  vertexNormals,
  weld,
  type Mesh,
} from "./build-brain-lib";

export const UPSTREAM_COMMIT = "ac32adad68d86af019fa99ecbf56eaed85a0039e";
const UPSTREAM_URL = `https://raw.githubusercontent.com/itayinbarr/brainproject/${UPSTREAM_COMMIT}/brain-atlas/models/brain.glb`;
const UPSTREAM_SHA256 = "76a49ea4526a4880613aec7a02756bd7301b0b9d0680d7cae33e197b672c5453";
const CACHE = `.cache/brain-${UPSTREAM_COMMIT.slice(0, 7)}.glb`;
export const OUTPUT = "public/models/brain.glb";

/** Cortex patches are near-closed shells with sub-0.1 mm cracks; everything else keeps the strict weld. */
const WELD_CORTEX = 1e-4;
const WELD_DEFAULT = 1e-5;
/** Upstream ships only `Medulla oblongata.l`; the right side is its mirror. */
const MIRROR_TO_RIGHT = new Set(["Medulla oblongata"]);
/** About 15 Pons vertices cross x = 0 on each side. */
const CLAMP_TO_SIDE = new Set(["Pons"]);

type Piece = { surface: Mesh; cap?: Mesh };

async function upstream(): Promise<Uint8Array> {
  const cached = Bun.file(CACHE);
  if (!(await cached.exists())) {
    console.log(`Downloading upstream brain.glb @ ${UPSTREAM_COMMIT.slice(0, 7)}…`);
    const res = await fetch(UPSTREAM_URL);
    if (!res.ok) throw new Error(`Upstream fetch failed: ${res.status} ${res.statusText}`);
    await mkdir(".cache", { recursive: true });
    await Bun.write(cached, res);
  }
  const bytes = new Uint8Array(await cached.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== UPSTREAM_SHA256) throw new Error(`Upstream GLB sha256 is ${sha}, expected ${UPSTREAM_SHA256}. Delete ${CACHE} and retry.`);
  return bytes;
}

/** All primitives of a node's mesh as one indexed mesh, in world space. */
function readMesh(node: GltfNode): Mesh {
  const matrix = node.getWorldMatrix();
  if (matrix.some((v, i) => v !== (i % 5 === 0 ? 1 : 0))) throw new Error(`${node.getName()} has a transform; expected identity`);
  const parts: Mesh[] = [];
  for (const prim of node.getMesh()?.listPrimitives() ?? []) {
    const pos = prim.getAttribute("POSITION")!;
    const idx = prim.getIndices();
    const positions = new Float32Array(pos.getCount() * 3);
    const v = [0, 0, 0];
    for (let i = 0; i < pos.getCount(); i++) positions.set(pos.getElement(i, v), i * 3);
    const indices = idx ? Uint32Array.from(idx.getArray()!) : Uint32Array.from({ length: pos.getCount() }, (_, i) => i);
    parts.push({ positions, indices });
  }
  return mergeMeshes(parts);
}

async function main() {
  const decoder = await draco3d.createDecoderModule();
  const encoder = await draco3d.createEncoderModule();
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "draco3d.decoder": decoder, "draco3d.encoder": encoder });
  const source = await io.readBinary(await upstream());

  // 1. Map every node, failing on anything the mapping doesn't account for.
  const errors: string[] = [];
  const pieces = new Map<string, Piece[]>();
  const add = (part: PartId, side: Side, piece: Piece) => {
    const key = meshName(part, side);
    pieces.set(key, [...(pieces.get(key) ?? []), piece]);
  };
  const labels = new Set<string>();
  let clamped = 0;
  const forced: string[] = [];

  for (const node of source.getRoot().listNodes()) {
    const extras = node.getExtras() as UpstreamExtras;
    const label = extras.bx_label?.trim() ?? node.getName();
    const role = roleOf(extras);
    if (role.kind === "unmapped") errors.push(`Core node "${label}" (${extras.bx_side}) is neither mapped nor hidden`);
    if (role.kind === "conflict") errors.push(`"${label}" maps to more than one part: ${role.claims.join(", ")}`);
    if (role.kind !== "part") continue;
    labels.add(`${label}|${extras.bx_side}`);

    let mesh = weld(readMesh(node), extras.bx_cat === "cortex" ? WELD_CORTEX : WELD_DEFAULT);
    if (extras.bx_side === "median") {
      for (const side of SIDES) {
        const half = cutAtMidline(mesh, side);
        if (half.forcedLoops) forced.push(`${label} (${side}): ${half.forcedLoops}`);
        add(role.part, side, { surface: half.surface, cap: half.cap });
      }
      continue;
    }
    const side: Side = extras.bx_side === "left" ? "left" : "right";
    if (CLAMP_TO_SIDE.has(label)) {
      const result = clampToSide(mesh, side);
      mesh = result.mesh;
      clamped += result.clamped;
    }
    add(role.part, side, { surface: mesh });
    if (MIRROR_TO_RIGHT.has(label)) add(role.part, "right", { surface: mirrorX(mesh) });
  }

  for (const label of MIRROR_TO_RIGHT) {
    if (!labels.has(`${label}|left`)) errors.push(`"${label}.l" is missing upstream; nothing to mirror`);
    if (labels.has(`${label}|right`)) errors.push(`"${label}.r" now exists upstream; stop mirroring it`);
  }
  const parts: PartId[] = [...STRUCTURE_IDS, WHITE_MATTER];
  for (const part of parts)
    for (const side of SIDES) if (!pieces.has(meshName(part, side))) errors.push(`${meshName(part, side)} has no geometry`);
  if (errors.length) throw new Error(`Brain mapping failed:\n  ${errors.join("\n  ")}`);

  // 2. Merge each part-side into a surface primitive and, for cut midline meshes, a cap primitive.
  const merged = parts.flatMap((part) =>
    SIDES.map((side) => {
      const list = pieces.get(meshName(part, side))!;
      const caps = list.flatMap((p) => (p.cap ? [p.cap] : []));
      return { part, side, surface: mergeMeshes(list.map((p) => p.surface)), cap: caps.length ? mergeMeshes(caps) : undefined };
    }),
  );

  // 3. Recentre on the brain's bounds. X stays put: x = 0 is the midline the cuts and Split rely on.
  const { min, max } = boundsOf(merged.map((m) => m.surface));
  const offset = [0, -(min[1] + max[1]) / 2, -(min[2] + max[2]) / 2] as const;

  // 4. Write: one node per part-side, no materials, positions and normals only, Draco.
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("brain");
  doc.getRoot().setDefaultScene(scene);
  const primitive = (mesh: Mesh) => {
    const m = translate(mesh, offset);
    return doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(m.positions).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(vertexNormals(m)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(m.indices).setBuffer(buffer));
  };
  let triangles = 0;
  for (const { part, side, surface, cap } of merged) {
    const name = meshName(part, side);
    const mesh = doc.createMesh(name).addPrimitive(primitive(surface));
    if (cap) mesh.addPrimitive(primitive(cap));
    triangles += triangleCount(surface) + (cap ? triangleCount(cap) : 0);
    const extras = part === WHITE_MATTER ? { context: true, side } : { structure: part, side };
    scene.addChild(doc.createNode(name).setMesh(mesh).setExtras(extras));
  }
  doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
    method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    encodeSpeed: 0,
    decodeSpeed: 5,
    quantizationBits: { POSITION: 14, NORMAL: 10 },
  });
  doc.getRoot().getAsset().generator = `sofia-kael build:brain from itayinbarr/brainproject@${UPSTREAM_COMMIT}`;

  await mkdir("public/models", { recursive: true });
  await io.write(OUTPUT, doc);

  const size = Bun.file(OUTPUT).size;
  const mm = (v: number) => (v * 1000).toFixed(1);
  console.log(`Wrote ${OUTPUT}: ${merged.length} meshes, ${triangles.toLocaleString("en-US")} triangles, ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Bounds after recentring (mm): x ${mm(min[0])}…${mm(max[0])}, y ±${mm((max[1] - min[1]) / 2)}, z ±${mm((max[2] - min[2]) / 2)}`);
  console.log(`Clamped ${clamped} vertices onto their side of the midline`);
  if (forced.length) console.log(`Cut loops closed end to end (open upstream meshes): ${forced.join("; ")}`);
}

if (import.meta.main) await main();
