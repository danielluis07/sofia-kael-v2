import { beforeAll, describe, expect, test } from "bun:test";
import { NodeIO, type Document } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { SIDES, STRUCTURE_IDS, WHITE_MATTER, meshName, type PartId } from "@/lib/brain/structures";
import { OUTPUT } from "./build-brain";

// Checks the committed curated GLB (ADR 0002, ADR 0006). Rebuild with `bun run build:brain`.

const MAX_BYTES = 3 * 1024 * 1024;
let doc: Document;

beforeAll(async () => {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });
  doc = await io.read(OUTPUT);
});

describe("public/models/brain.glb", () => {
  test("is within the 3 MB budget", () => {
    expect(Bun.file(OUTPUT).size).toBeLessThanOrEqual(MAX_BYTES);
  });

  test("has one node per Structure-side, plus the white-matter context pair", () => {
    const names = doc.getRoot().listNodes().map((n) => n.getName());
    const parts: PartId[] = [...STRUCTURE_IDS, WHITE_MATTER];
    const expected = parts.flatMap((part) => SIDES.map((side) => meshName(part, side)));
    expect(names.toSorted()).toEqual(expected.toSorted());
  });

  test("tags each node with its Structure and side, or as context", () => {
    for (const node of doc.getRoot().listNodes()) {
      const [part, suffix] = node.getName().split(".");
      const side = suffix === "l" ? "left" : "right";
      expect(node.getExtras()).toEqual(part === WHITE_MATTER ? { context: true, side } : { structure: part, side });
    }
  });

  test("is flat, untransformed and Draco-compressed", () => {
    const root = doc.getRoot();
    expect(root.listScenes()).toHaveLength(1);
    expect(root.listScenes()[0].listChildren()).toHaveLength(root.listNodes().length);
    for (const node of root.listNodes()) {
      expect(node.listChildren()).toHaveLength(0);
      expect(node.getMatrix()).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }
    expect(root.listExtensionsRequired().map((e) => e.extensionName)).toEqual(["KHR_draco_mesh_compression"]);
  });

  test("carries no materials or textures, and positions and normals only", () => {
    const root = doc.getRoot();
    expect(root.listMaterials()).toHaveLength(0);
    expect(root.listTextures()).toHaveLength(0);
    for (const mesh of root.listMeshes())
      for (const prim of mesh.listPrimitives()) {
        expect(prim.listSemantics().toSorted()).toEqual(["NORMAL", "POSITION"]);
        expect(prim.getMaterial()).toBeNull();
        expect(prim.getIndices()).not.toBeNull();
      }
  });

  test("keeps each side on its own side of the midline, so Split separates the whole brain", () => {
    const tolerance = 0.002; // metres: upstream patches brush the midline by up to ~1.6 mm
    for (const node of doc.getRoot().listNodes()) {
      const left = node.getName().endsWith(".l");
      for (const prim of node.getMesh()!.listPrimitives()) {
        const pos = prim.getAttribute("POSITION")!;
        if (left) expect(pos.getMin([])[0]).toBeGreaterThan(-tolerance);
        else expect(pos.getMax([])[0]).toBeLessThan(tolerance);
      }
    }
  });

  test("is recentred on the brain's own bounds, in metres", () => {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const mesh of doc.getRoot().listMeshes())
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute("POSITION")!;
        pos.getMin([]).forEach((v, k) => (min[k] = Math.min(min[k], v)));
        pos.getMax([]).forEach((v, k) => (max[k] = Math.max(max[k], v)));
      }
    for (let k = 0; k < 3; k++) {
      expect(Math.abs(min[k] + max[k]) / 2).toBeLessThan(0.001);
      expect(max[k] - min[k]).toBeGreaterThan(0.12);
      expect(max[k] - min[k]).toBeLessThan(0.2);
    }
  });
});
