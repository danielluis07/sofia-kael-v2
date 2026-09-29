import { describe, expect, test } from "bun:test";
import { CORTEX_STRUCTURES, STRUCTURE_IDS, layerOf, meshName, roleOf } from "./structures";

describe("STRUCTURE_IDS", () => {
  test("lists 20 unique Structures, lobes first and cerebellum last", () => {
    expect(new Set(STRUCTURE_IDS).size).toBe(20);
    expect(STRUCTURE_IDS[0]).toBe("frontal-lobe");
    expect(STRUCTURE_IDS.at(-1)).toBe("cerebellum");
  });

  test("the eight cortical Structures are the X-ray outer layer, everything else is deep", () => {
    expect(STRUCTURE_IDS.filter((id) => layerOf(id) === "cortex")).toEqual([...CORTEX_STRUCTURES]);
    expect(CORTEX_STRUCTURES).toHaveLength(8);
    expect(layerOf("hippocampus")).toBe("deep");
  });

  test("names meshes <id>.l / <id>.r", () => {
    expect(meshName("pons", "left")).toBe("pons.l");
    expect(meshName("white-matter", "right")).toBe("white-matter.r");
  });
});

describe("roleOf", () => {
  const cortex = { bx_core: 1, bx_cat: "cortex", bx_side: "left" } as const;

  test("a label claim beats the lobe: the Precentral gyrus is not Frontal lobe", () => {
    expect(roleOf({ ...cortex, bx_label: "Precentral gyrus", bx_region: "Frontal lobe" })).toEqual({ kind: "part", part: "precentral-gyrus" });
    expect(roleOf({ ...cortex, bx_label: "Middle frontal gyrus", bx_region: "Frontal lobe" })).toEqual({ kind: "part", part: "frontal-lobe" });
  });

  test("limbic cortex patches are the Cingulate gyrus, except the Hippocampus", () => {
    expect(roleOf({ ...cortex, bx_label: "Cingulate gyrus (Posteroventral part)", bx_region: "Limbic lobe" })).toEqual({ kind: "part", part: "cingulate-gyrus" });
    expect(roleOf({ ...cortex, bx_label: "Hippocampus", bx_region: "Limbic lobe" })).toEqual({ kind: "part", part: "hippocampus" });
  });

  test("groups nuclei by their upstream parent", () => {
    expect(roleOf({ bx_core: 1, bx_cat: "diencephalon", bx_label: "Pulvinar", bx_parent: "Thalamus" })).toEqual({ kind: "part", part: "thalamus" });
  });

  test("Base of peduncle is the crus cerebri, not cerebellum", () => {
    expect(roleOf({ bx_core: 1, bx_cat: "cerebellum", bx_label: "Base of peduncle" })).toEqual({ kind: "part", part: "midbrain" });
    expect(roleOf({ bx_core: 1, bx_cat: "cerebellum", bx_label: "Culmen" })).toEqual({ kind: "part", part: "cerebellum" });
  });

  test("hides non-core nodes and the listed core ones", () => {
    expect(roleOf({ bx_core: 0, bx_cat: "arteries", bx_label: "Basilar artery" })).toEqual({ kind: "hidden" });
    expect(roleOf({ bx_core: 1, bx_cat: "white_matter", bx_label: "Fornix" })).toEqual({ kind: "hidden" });
  });

  test("reports core nodes nothing claims, and nodes claimed twice", () => {
    expect(roleOf({ bx_core: 1, bx_cat: "deep_grey", bx_label: "Claustrum" })).toEqual({ kind: "unmapped" });
    expect(roleOf({ bx_core: 1, bx_cat: "deep_grey", bx_label: "Putamen", bx_parent: "Thalamus" }).kind).toBe("conflict");
  });

  test("trims stray whitespace in labels", () => {
    expect(roleOf({ ...cortex, bx_label: " Posterior transverse collateral sulcus" })).toEqual({ kind: "part", part: "temporal-lobe" });
  });
});
