// Anatomy facts shared by the GLB build (scripts/build-brain.ts), the Explorer
// reducer and the scene. No prose here: names and copy live in content/ (ADR 0004).

/** Structure index order: DESIGN.md §9's list, lobes first, then deep Structures, brainstem and cerebellum. */
export const STRUCTURE_IDS = [
  "frontal-lobe",
  "parietal-lobe",
  "temporal-lobe",
  "occipital-lobe",
  "insula",
  "precentral-gyrus",
  "postcentral-gyrus",
  "cingulate-gyrus",
  "corpus-callosum",
  "thalamus",
  "hypothalamus",
  "hippocampus",
  "amygdala",
  "basal-ganglia",
  "substantia-nigra",
  "ventricles",
  "midbrain",
  "pons",
  "medulla-oblongata",
  "cerebellum",
] as const;

export type StructureId = (typeof STRUCTURE_IDS)[number];

export function isStructureId(value: string): value is StructureId {
  return (STRUCTURE_IDS as readonly string[]).includes(value);
}

/** Left is +X in the model. */
export const SIDES = ["left", "right"] as const;
export type Side = (typeof SIDES)[number];

/** The white-matter context meshes: never selectable, shown and capped only during Slice, never part of X-ray. */
export const WHITE_MATTER = "white-matter";
export type PartId = StructureId | typeof WHITE_MATTER;

/** Node name in the curated GLB, e.g. `frontal-lobe.l`. */
export function meshName(part: PartId, side: Side): string {
  return `${part}.${side === "left" ? "l" : "r"}`;
}

/** Extras on each curated GLB node (three.js surfaces them as `userData`). */
export type StructureMeshExtras = { structure: StructureId; side: Side };
export type ContextMeshExtras = { context: true; side: Side };

// X-ray layer (ADR 0002): the eight cortical Structures fade; everything else is deep.

export const CORTEX_STRUCTURES = [
  "frontal-lobe",
  "parietal-lobe",
  "temporal-lobe",
  "occipital-lobe",
  "insula",
  "precentral-gyrus",
  "postcentral-gyrus",
  "cingulate-gyrus",
] as const satisfies readonly StructureId[];

export type Layer = "cortex" | "deep";

export function layerOf(id: StructureId): Layer {
  return (CORTEX_STRUCTURES as readonly StructureId[]).includes(id) ? "cortex" : "deep";
}

// Upstream node → Structure mapping (ADR 0002). Keys are `bx_*` extras on the
// Z-Anatomy nodes, never node names. A node's label, parent group and the hidden
// list are exclusive claims; region and category are fallbacks for what's left.

/** The `bx_*` extras on an upstream Z-Anatomy node. */
export type UpstreamExtras = {
  bx_label?: string;
  bx_cat?: string;
  bx_side?: "left" | "right" | "median";
  bx_region?: string;
  bx_parent?: string;
  bx_core?: number;
};

export const BY_LABEL: Readonly<Record<string, PartId>> = {
  "Precentral gyrus": "precentral-gyrus",
  "Central sulcus": "precentral-gyrus",
  "Postcentral gyrus": "postcentral-gyrus",
  "Parieto-occipital sulcus": "parietal-lobe",
  "Subparietal sulcus": "parietal-lobe",
  "Sulcus interm prim-Jensen": "parietal-lobe",
  "Lat Fis-post": "temporal-lobe",
  "Collateral sulcus": "temporal-lobe",
  "Posterior transverse collateral sulcus": "temporal-lobe",
  "Anterior occipital sulcus": "temporal-lobe",
  "Circular sulcus of insula": "insula",
  Hippocampus: "hippocampus",
  "Corpus callosum": "corpus-callosum",
  "Lateral geniculate body": "thalamus",
  "Medial geniculate body": "thalamus",
  "Mamillary body": "hypothalamus",
  "Caudate nucleus": "basal-ganglia",
  Putamen: "basal-ganglia",
  "Nucleus accumbens": "basal-ganglia",
  "Subthalamic nucleus": "basal-ganglia",
  "Substantia nigra": "substantia-nigra",
  "Lateral ventricle": "ventricles",
  "Choroid plexus": "ventricles",
  "Third ventricle": "ventricles",
  "Aqueduct of midbrain": "ventricles",
  "Fourth ventricle": "ventricles",
  Midbrain: "midbrain",
  "Superior colliculus": "midbrain",
  "Inferior colliculus": "midbrain",
  "Red nucleus": "midbrain",
  "Nucleus of oculomotor nerve": "midbrain",
  "Accessory nucleus of oculomotor nerve": "midbrain",
  "Interpeduncular fossa": "midbrain",
  // Upstream files it under cerebellum; it is the crus cerebri.
  "Base of peduncle": "midbrain",
  Pons: "pons",
  "Nucleus of abducens nerve": "pons",
  "Motor nucleus of facial nerve": "pons",
  "Superior salivatory nucleus": "pons",
  "Vestibular nuclei": "pons",
  "Medulla oblongata": "medulla-oblongata",
  Olive: "medulla-oblongata",
  "Pyramid of medulla oblongata": "medulla-oblongata",
  "White matter of telencephalon": WHITE_MATTER,
};

export const BY_PARENT: Readonly<Record<string, StructureId>> = {
  Thalamus: "thalamus",
  Hypothalamus: "hypothalamus",
  "Amygdaloid body": "amygdala",
  "Globus pallidus": "basal-ganglia",
};

/** Cortex patches not claimed by label fall to their lobe. Limbic is the five cingulate patches (Hippocampus is claimed by label). */
export const BY_REGION: Readonly<Record<string, StructureId>> = {
  "Frontal lobe": "frontal-lobe",
  "Parietal lobe": "parietal-lobe",
  "Temporal lobe": "temporal-lobe",
  "Occipital lobe": "occipital-lobe",
  Insula: "insula",
  "Limbic lobe": "cingulate-gyrus",
};

/** Core nodes dropped from the curated GLB. Non-core nodes (vessels, meninges, cranial nerves, tracts) are always dropped. */
export const HIDDEN_LABELS: ReadonlySet<string> = new Set([
  "Fornix",
  "Anterior commissure",
  "Posterior commissure",
  "Hippocampal commissure",
  "Septal nuclei",
  "Septum pellucidum",
  "Stria terminalis",
  "Stria medullaris thalami",
  "Habenula",
  "Pineal gland",
  "Adenohypophysis",
  "Neurohypophysis",
  "Optic chiasm",
  "Optic tract",
]);

export type NodeRole =
  | { kind: "part"; part: PartId }
  | { kind: "hidden" }
  | { kind: "unmapped" }
  | { kind: "conflict"; claims: string[] };

export function roleOf(extras: UpstreamExtras): NodeRole {
  if (extras.bx_core !== 1) return { kind: "hidden" };
  const label = extras.bx_label?.trim() ?? "";

  const claims: { rule: string; role: NodeRole }[] = [];
  if (HIDDEN_LABELS.has(label)) claims.push({ rule: "hidden", role: { kind: "hidden" } });
  const byLabel = BY_LABEL[label];
  if (byLabel) claims.push({ rule: `label → ${byLabel}`, role: { kind: "part", part: byLabel } });
  const byParent = extras.bx_parent ? BY_PARENT[extras.bx_parent] : undefined;
  if (byParent) claims.push({ rule: `parent → ${byParent}`, role: { kind: "part", part: byParent } });

  if (claims.length > 1) return { kind: "conflict", claims: claims.map((c) => c.rule) };
  if (claims.length === 1) return claims[0].role;

  const byRegion = extras.bx_region ? BY_REGION[extras.bx_region] : undefined;
  if (extras.bx_cat === "cortex" && byRegion) return { kind: "part", part: byRegion };
  if (extras.bx_cat === "cerebellum") return { kind: "part", part: "cerebellum" };
  return { kind: "unmapped" };
}
