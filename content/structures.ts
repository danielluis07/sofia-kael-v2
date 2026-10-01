import type { StructureId } from "@/lib/brain/structures";

export type StructureContent = {
  name: string;
  aka?: string;
  latin: string;
  description: string;
};

export const STRUCTURES = {
  "frontal-lobe": {
    name: "Lobo frontal",
    latin: "Lobus frontalis",
    description: "O lobo frontal ajuda você a planejar, tomar decisões e controlar o comportamento. Também participa da fala e trabalha com outras estruturas para orientar os movimentos.",
  },
  "parietal-lobe": {
    name: "Lobo parietal",
    latin: "Lobus parietalis",
    description: "O lobo parietal reúne informações sobre o toque e a posição do corpo no espaço. Ele ajuda você a perceber distâncias e direcionar a atenção ao que está ao seu redor.",
  },
  "temporal-lobe": {
    name: "Lobo temporal",
    latin: "Lobus temporalis",
    description: "O lobo temporal ajuda você a processar sons e compreender a linguagem. Também trabalha com estruturas próximas para formar memórias e reconhecer pessoas e objetos familiares.",
  },
  "occipital-lobe": {
    name: "Lobo occipital",
    latin: "Lobus occipitalis",
    description: "O lobo occipital processa as informações que chegam dos olhos. Ele ajuda você a interpretar as formas, as cores e os movimentos do que vê.",
  },
  insula: {
    name: "Ínsula",
    latin: "Insula",
    description: "A ínsula fica sob as dobras externas do cérebro e ajuda você a perceber o que acontece dentro do corpo. Também participa do processamento do paladar e da experiência emocional da dor.",
  },
  "precentral-gyrus": {
    name: "Giro pré-central",
    aka: "córtex motor",
    latin: "Gyrus precentralis",
    description: "O giro pré-central é uma dobra da camada externa do cérebro, também chamada de córtex motor. Ele envia sinais que ajudam você a mover o corpo voluntariamente, com cada lado controlando principalmente o lado oposto do corpo.",
  },
  "postcentral-gyrus": {
    name: "Giro pós-central",
    aka: "córtex sensorial",
    latin: "Gyrus postcentralis",
    description: "O giro pós-central é uma dobra da camada externa do cérebro, também chamada de córtex sensorial. Ele processa o toque e as informações sobre a posição do corpo, com cada lado recebendo principalmente sinais do lado oposto do corpo.",
  },
  "cingulate-gyrus": {
    name: "Giro do cíngulo",
    latin: "Gyrus cinguli",
    description: "O giro do cíngulo é uma dobra na superfície interna do cérebro. Ele ajuda a conectar emoções, atenção e comportamento, além de participar da forma como você sente a dor.",
  },
  "corpus-callosum": {
    name: "Corpo caloso",
    latin: "Corpus callosum",
    description: "O corpo caloso é um feixe largo de fibras nervosas que conecta as duas metades do cérebro. Ele permite que elas compartilhem informações e trabalhem juntas.",
  },
  thalamus: {
    name: "Tálamo",
    latin: "Thalamus",
    description: "O tálamo retransmite a maior parte das informações sensoriais à camada externa do cérebro para processamento. Também participa dos sinais de movimento e ajuda a regular o estado de alerta e o sono.",
  },
  hypothalamus: {
    name: "Hipotálamo",
    latin: "Hypothalamus",
    description: "O hipotálamo ajuda a regular a temperatura corporal, a fome e a sede. Também controla a liberação de hormônios, mensageiros químicos que influenciam funções em todo o corpo.",
  },
  hippocampus: {
    name: "Hipocampo",
    latin: "Hippocampus",
    description: "O hipocampo ajuda a transformar experiências em memórias duradouras. Também ajuda você a lembrar de lugares e se orientar em ambientes familiares.",
  },
  amygdala: {
    name: "Amígdala",
    latin: "Corpus amygdaloideum",
    description: "A amígdala ajuda o cérebro a reconhecer experiências emocionalmente significativas, incluindo possíveis ameaças. Ela trabalha com estruturas da memória para ajudar você a aprender com essas experiências.",
  },
  "basal-ganglia": {
    name: "Núcleos da base",
    latin: "Nuclei basales",
    description: "Os núcleos da base são grupos de células nervosas nas regiões profundas do cérebro que ajudam a selecionar e regular os movimentos. Também participam do aprendizado de hábitos por repetição.",
  },
  "substantia-nigra": {
    name: "Substância negra",
    latin: "Substantia nigra",
    description: "A substância negra contém células nervosas que produzem dopamina, um mensageiro químico usado no controle dos movimentos. Essas células enviam sinais aos núcleos da base, grupos de células nervosas que ajudam a regular o movimento.",
  },
  ventricles: {
    name: "Ventrículos",
    latin: "Ventriculi cerebri",
    description: "Os ventrículos são espaços conectados dentro do cérebro, preenchidos por líquido cefalorraquidiano, que protege o cérebro e a medula espinhal. Esse líquido circula por esses espaços e ao redor do cérebro e da medula espinhal.",
  },
  midbrain: {
    name: "Mesencéfalo",
    latin: "Mesencephalon",
    description: "O mesencéfalo é a parte superior do tronco encefálico, que conecta o cérebro à medula espinhal. Ele ajuda a controlar os movimentos dos olhos e as respostas a estímulos visuais e sonoros.",
  },
  pons: {
    name: "Ponte",
    latin: "Pons",
    description: "A ponte faz parte do tronco encefálico, que conecta o cérebro à medula espinhal. Ela retransmite sinais envolvidos no movimento e ajuda a regular a respiração e o sono.",
  },
  "medulla-oblongata": {
    name: "Bulbo",
    latin: "Medulla oblongata",
    description: "O bulbo é a parte inferior do tronco encefálico, que conecta o cérebro à medula espinhal. Ele ajuda a controlar funções automáticas, como a respiração, os batimentos cardíacos e a deglutição.",
  },
  cerebellum: {
    name: "Cerebelo",
    latin: "Cerebellum",
    description: "O cerebelo ajuda a coordenar o ritmo e a precisão dos movimentos. Também contribui para o equilíbrio e para o aprendizado de habilidades motoras por meio da prática.",
  },
} as const satisfies Record<StructureId, StructureContent>;
