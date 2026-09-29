// PROTOTYPE (issue #6). A runtime stand-in for ADR 0002's build-time mapping, good
// enough to judge the look. The real mapping lives in lib/brain/ once it's built.

export const STRUCTURES = {
  "frontal-lobe": "Frontal lobe",
  "precentral-gyrus": "Precentral gyrus",
  "postcentral-gyrus": "Postcentral gyrus",
  "parietal-lobe": "Parietal lobe",
  "temporal-lobe": "Temporal lobe",
  "occipital-lobe": "Occipital lobe",
  insula: "Insula",
  "cingulate-gyrus": "Cingulate gyrus",
  hippocampus: "Hippocampus",
  "corpus-callosum": "Corpus callosum",
  thalamus: "Thalamus",
  hypothalamus: "Hypothalamus",
  amygdala: "Amygdala",
  "basal-ganglia": "Basal ganglia",
  "substantia-nigra": "Substantia nigra",
  ventricles: "Ventricles",
  midbrain: "Midbrain",
  pons: "Pons",
  "medulla-oblongata": "Medulla oblongata",
  cerebellum: "Cerebellum",
} as const;

export type StructureId = keyof typeof STRUCTURES;
export type PartId = StructureId | "white-matter";

export const CORTEX = new Set<PartId>([
  "frontal-lobe",
  "precentral-gyrus",
  "postcentral-gyrus",
  "parietal-lobe",
  "temporal-lobe",
  "occipital-lobe",
  "insula",
  "cingulate-gyrus",
]);

// Outer → inner: later caps overwrite earlier coplanar ones (ticket #5).
export const CAP_ORDER: PartId[] = [
  "white-matter",
  ...CORTEX,
  "corpus-callosum",
  "ventricles",
  "hippocampus",
  "cerebellum",
  "basal-ganglia",
  "thalamus",
  "hypothalamus",
  "amygdala",
  "midbrain",
  "pons",
  "medulla-oblongata",
  "substantia-nigra",
];

const BY_LABEL: Record<string, PartId> = {
  "Precentral gyrus": "precentral-gyrus",
  "Central sulcus": "precentral-gyrus",
  "Postcentral gyrus": "postcentral-gyrus",
  "Circular sulcus of insula": "insula",
  "Parieto-occipital sulcus": "parietal-lobe",
  "Subparietal sulcus": "parietal-lobe",
  "Sulcus interm prim-Jensen": "parietal-lobe",
  "Lat Fis-post": "temporal-lobe",
  "Collateral sulcus": "temporal-lobe",
  "Posterior transverse collateral sulcus": "temporal-lobe",
  "Anterior occipital sulcus": "temporal-lobe",
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
  "Base of peduncle": "midbrain",
  Pons: "pons",
  "Nucleus of abducens nerve": "pons",
  "Motor nucleus of facial nerve": "pons",
  "Superior salivatory nucleus": "pons",
  "Vestibular nuclei": "pons",
  "Medulla oblongata": "medulla-oblongata",
  Olive: "medulla-oblongata",
  "Pyramid of medulla oblongata": "medulla-oblongata",
  "White matter of telencephalon": "white-matter",
};

const HIDDEN = new Set([
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

const BY_PARENT: Record<string, PartId> = {
  Thalamus: "thalamus",
  Hypothalamus: "hypothalamus",
  "Amygdaloid body": "amygdala",
  "Globus pallidus": "basal-ganglia",
};

const BY_REGION: Record<string, PartId> = {
  "Frontal lobe": "frontal-lobe",
  "Parietal lobe": "parietal-lobe",
  "Temporal lobe": "temporal-lobe",
  "Occipital lobe": "occipital-lobe",
  Insula: "insula",
};

export type NodeExtras = {
  bx_label?: string;
  bx_cat?: string;
  bx_side?: "left" | "right" | "median";
  bx_region?: string;
  bx_parent?: string;
  bx_core?: number;
};

export function partFor(ud: NodeExtras): PartId | null {
  if (ud.bx_core !== 1 || !ud.bx_label) return null;
  const label = ud.bx_label.trim();
  if (HIDDEN.has(label)) return null;
  if (BY_LABEL[label]) return BY_LABEL[label];
  if (ud.bx_parent && BY_PARENT[ud.bx_parent]) return BY_PARENT[ud.bx_parent];
  if (ud.bx_cat === "cortex") {
    if (label.startsWith("Cingulate")) return "cingulate-gyrus";
    if (ud.bx_region && BY_REGION[ud.bx_region]) return BY_REGION[ud.bx_region];
  }
  if (ud.bx_cat === "cerebellum") return "cerebellum";
  console.warn("[prototype] unmapped core node", label, ud);
  return null;
}
