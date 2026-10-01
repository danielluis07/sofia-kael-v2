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
    name: "Epilepsia do lobo temporal",
    oneLiner: "Crises recorrentes no lobo temporal podem afetar a consciência e a memória.",
    description: "A epilepsia do lobo temporal causa crises recorrentes, episódios de atividade elétrica incomum que começam no lobo temporal, na lateral do cérebro. Elas podem alterar a consciência ou provocar sensações incomuns e envolver estruturas próximas que processam a memória e as emoções.",
    structures: ["hippocampus", "temporal-lobe", "amygdala"],
  },
  {
    id: "alzheimers-disease",
    name: "Doença de Alzheimer",
    oneLiner: "Mudanças graduais na memória e no pensamento podem dificultar as tarefas diárias.",
    description: "A doença de Alzheimer danifica gradualmente as células nervosas e afeta a memória e o pensamento. As alterações costumam começar em estruturas da memória, como o hipocampo, e podem se estender a estruturas envolvidas na linguagem e na compreensão do ambiente.",
    structures: ["hippocampus", "temporal-lobe", "parietal-lobe"],
  },
  {
    id: "parkinsons-disease",
    name: "Doença de Parkinson",
    oneLiner: "Lentidão, rigidez e tremores podem surgir com alterações nos sinais de movimento.",
    description: "A doença de Parkinson envolve a perda de células nervosas que produzem dopamina, um mensageiro químico que ajuda a regular os movimentos. Alterações nos sinais da substância negra para os núcleos da base, grupos de células nervosas que regulam o movimento, podem causar lentidão, rigidez e tremores.",
    structures: ["substantia-nigra", "basal-ganglia"],
  },
  {
    id: "essential-tremor",
    name: "Tremor essencial",
    oneLiner: "Tremores rítmicos involuntários costumam afetar as mãos ao segurar ou mover objetos.",
    description: "O tremor essencial causa tremores rítmicos involuntários, frequentemente nas mãos durante o movimento ou ao manter uma posição. Ele envolve circuitos motores que incluem o cerebelo e o tálamo, embora sua causa ainda não seja totalmente compreendida.",
    structures: ["cerebellum", "thalamus"],
  },
  {
    id: "stroke",
    name: "Acidente vascular cerebral (AVC)",
    oneLiner: "A interrupção do fluxo sanguíneo ou sangramentos podem afetar subitamente funções cerebrais.",
    description: "Um AVC ocorre quando a obstrução de um vaso sanguíneo ou um sangramento danifica o tecido cerebral. Seus efeitos dependem das estruturas afetadas e podem incluir alterações no movimento, na fala ou na sensibilidade. Sintomas súbitos de AVC exigem atendimento médico de emergência.",
    structures: ["precentral-gyrus", "frontal-lobe", "parietal-lobe"],
  },
  {
    id: "migraine",
    name: "Enxaqueca",
    oneLiner: "Crises recorrentes podem causar cefaleia, náusea e sensibilidade à luz ou ao som.",
    description: "A enxaqueca causa crises recorrentes que frequentemente incluem dor de cabeça, náusea e sensibilidade à luz ou ao som. Algumas pessoas apresentam aura, alterações temporárias na visão ou em outras sensações, e as crises envolvem redes que processam a dor e as informações sensoriais.",
    structures: ["occipital-lobe", "thalamus", "pons"],
  },
  {
    id: "multiple-sclerosis",
    name: "Esclerose múltipla",
    oneLiner: "Danos à proteção dos nervos podem alterar o movimento, a sensibilidade e a visão.",
    description: "Na esclerose múltipla, o sistema imunológico danifica a mielina, a camada protetora das fibras nervosas do cérebro e da medula espinhal. As alterações podem afetar o corpo caloso, feixe nervoso que conecta as duas metades do cérebro, e o mesencéfalo, na parte superior da conexão entre cérebro e medula. Os ventrículos, espaços preenchidos por líquido no cérebro, indicam locais onde podem ocorrer alterações no tecido ao redor; esses espaços não são o tecido afetado.",
    structures: ["corpus-callosum", "ventricles", "midbrain"],
  },
  {
    id: "hydrocephalus",
    name: "Hidrocefalia",
    oneLiner: "O excesso de líquido nos espaços internos do cérebro pode pressionar tecidos.",
    description: "A hidrocefalia é o acúmulo de líquido cefalorraquidiano, que protege o cérebro e a medula espinhal. Esse acúmulo pode aumentar os ventrículos, espaços preenchidos por líquido dentro do cérebro, e pressionar o tecido ao redor.",
    structures: ["ventricles"],
  },
  {
    id: "ataxia",
    name: "Ataxia",
    oneLiner: "Dificuldades de coordenação podem afetar a caminhada, o equilíbrio e movimentos cotidianos.",
    description: "Ataxia significa dificuldade para coordenar os movimentos e pode afetar o equilíbrio, a caminhada ou a fala. Ela pode resultar de alterações no cerebelo ou em suas conexões e tem várias causas possíveis.",
    structures: ["cerebellum"],
  },
  {
    id: "vertigo",
    name: "Vertigem",
    oneLiner: "Uma sensação de rotação ou movimento pode ocorrer mesmo ao ficar parado.",
    description: "Vertigem é a sensação de que você ou o ambiente estão em movimento quando estão parados. Ela costuma começar no ouvido interno, mas também pode surgir de alterações nas vias do equilíbrio que envolvem a ponte, o bulbo e o cerebelo.",
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
