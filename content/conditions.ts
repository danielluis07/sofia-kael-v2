import type { StructureId } from "@/lib/brain/structures";

export type ConditionContent = {
  id: string;
  name: string;
  oneLiner: string;
  description: string;
  structures: readonly StructureId[];
};

/** Order matches the Conditions index; ids remain stable when names change. */
export const CONDITIONS = [
  {
    id: "temporal-lobe-epilepsy",
    name: "Epilepsy (temporal lobe)",
    oneLiner: "Recurring seizures starting in the temporal lobe can affect awareness and memory.",
    description: "Temporal lobe epilepsy causes recurring seizures, episodes of unusual electrical activity that begin in the temporal lobe at the side of the brain. They can change awareness or cause unfamiliar sensations, and may involve nearby Structures that process memory and emotion.",
    structures: ["hippocampus", "temporal-lobe", "amygdala"],
  },
  {
    id: "alzheimers-disease",
    name: "Alzheimer's disease",
    oneLiner: "Gradual changes in memory and thinking can make daily tasks harder.",
    description: "Alzheimer's disease gradually damages nerve cells and affects memory and thinking. Changes often begin in memory Structures such as the hippocampus and can spread to Structures involved in language and understanding your surroundings.",
    structures: ["hippocampus", "temporal-lobe", "parietal-lobe"],
  },
  {
    id: "parkinsons-disease",
    name: "Parkinson's disease",
    oneLiner: "Slower movement, stiffness and shaking can develop as movement signals change.",
    description: "Parkinson's disease involves the loss of nerve cells that produce dopamine, a chemical messenger that helps regulate movement. Changes in signals from the substantia nigra to the basal ganglia, groups of nerve cells that regulate movement, can cause slowness, stiffness and shaking.",
    structures: ["substantia-nigra", "basal-ganglia"],
  },
  {
    id: "essential-tremor",
    name: "Essential tremor",
    oneLiner: "Unwanted rhythmic shaking often affects the hands when holding or moving objects.",
    description: "Essential tremor causes unwanted rhythmic shaking, often in the hands during movement or while holding a position. It involves movement circuits that include the cerebellum and thalamus, though its cause is not fully understood.",
    structures: ["cerebellum", "thalamus"],
  },
  {
    id: "stroke",
    name: "Stroke",
    oneLiner: "Interrupted blood flow or bleeding in the brain can suddenly disrupt function.",
    description: "A stroke occurs when a blocked blood vessel or bleeding damages brain tissue. Its effects depend on the Structures affected and may include changes in movement, speech or sensation. Sudden stroke symptoms require emergency medical care.",
    structures: ["precentral-gyrus", "frontal-lobe", "parietal-lobe"],
  },
  {
    id: "migraine",
    name: "Migraine",
    oneLiner: "Recurring attacks can cause headache, nausea and sensitivity to light or sound.",
    description: "Migraine causes recurring attacks that often include headache, nausea and sensitivity to light or sound. Some people have an aura, temporary changes in vision or other sensations, and the attacks involve networks that process pain and sensory information.",
    structures: ["occipital-lobe", "thalamus", "pons"],
  },
  {
    id: "multiple-sclerosis",
    name: "Multiple sclerosis",
    oneLiner: "Damage to nerve coverings can disrupt signals affecting movement, sensation and vision.",
    description: "In multiple sclerosis, the immune system damages myelin, the protective covering around nerve fibers in the brain and spinal cord. Changes can affect the corpus callosum, the nerve bundle connecting the brain's two halves, and the midbrain at the top of the connection between brain and spinal cord. The ventricles, the brain's fluid spaces, mark where changes can occur in surrounding tissue; the fluid spaces themselves are not the affected tissue.",
    structures: ["corpus-callosum", "ventricles", "midbrain"],
  },
  {
    id: "hydrocephalus",
    name: "Hydrocephalus",
    oneLiner: "Excess fluid in the brain's internal spaces can put pressure on tissue.",
    description: "Hydrocephalus is a buildup of cerebrospinal fluid, the liquid that cushions the brain and spinal cord. It can enlarge the ventricles, the fluid spaces inside the brain, and put pressure on surrounding tissue.",
    structures: ["ventricles"],
  },
  {
    id: "ataxia",
    name: "Ataxia",
    oneLiner: "Problems coordinating movement can affect walking, balance and everyday use of hands.",
    description: "Ataxia means difficulty coordinating movements and can affect balance, walking or speech. It can result from changes in the cerebellum or its connections and has several possible causes.",
    structures: ["cerebellum"],
  },
  {
    id: "vertigo",
    name: "Vertigo",
    oneLiner: "A feeling of spinning or movement can occur even while sitting still.",
    description: "Vertigo is the sensation that you or your surroundings are moving when they are still. It often starts in the inner ear, but can also arise from changes in balance pathways involving the pons, medulla oblongata and cerebellum.",
    structures: ["pons", "medulla-oblongata", "cerebellum"],
  },
] as const satisfies readonly ConditionContent[];

export type Condition = (typeof CONDITIONS)[number];
export type ConditionId = Condition["id"];

export function conditionsForStructure(id: StructureId): readonly Condition[] {
  return CONDITIONS.filter((condition) =>
    (condition.structures as readonly StructureId[]).includes(id),
  );
}

export function isConditionId(value: string): value is ConditionId {
  return CONDITIONS.some((condition) => condition.id === value);
}

export function conditionById(id: ConditionId): Condition {
  return CONDITIONS.find((condition) => condition.id === id)!;
}

/** The `id` of a Condition's row in the Conditions section, the target of its chips. */
export function conditionRowId(id: ConditionId) {
  return `condition-${id}` as const;
}
