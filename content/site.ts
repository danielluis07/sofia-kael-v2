import type { SliceAxis } from "@/lib/brain/slice";

export type SectionLink = { id: string; label: string };

export const SECTIONS = [
  { id: "about", label: "Sobre" },
  { id: "conditions", label: "Condições" },
  { id: "brain-explorer", label: "ENtenda o cérebro" },
  { id: "first-visit", label: "Primeira consulta" },
  { id: "contact", label: "Contato" },
] as const satisfies readonly SectionLink[];

export type SectionId = (typeof SECTIONS)[number]["id"];

export function sectionHref(id: SectionId) {
  return `#${id}` as const;
}
export type SectionContent = {
  eyebrow: string;
  headline: string;
  lede: string;
};

export const NAV = {
  wordmark: "Kael Neurologia",
  consultation: "Agende uma consulta",
  menu: "Menu",
  closeMenu: "Fechar menu",
  navigationLabel: "Navegação principal",
} as const satisfies Record<string, string>;

export type HeroContent = {
  headline: string;
  lede: string;
  consultation: string;
  explore: string;
  portraitCallout: string;
};

export const HERO = {
  headline: "Cuidado em neurologia clínica.",
  lede: "A Dra. Sofia Kael dedica tempo para ouvir, explicar o que os sintomas podem indicar e conversar com você sobre os próximos passos.",
  consultation: NAV.consultation,
  explore: "Entenda o cérebro humano",
  portraitCallout: "Dra. Sofia Kael · Neurologista",
} as const satisfies HeroContent;

export const ABOUT = {
  eyebrow: SECTIONS[0].label,
  headline: "Cuidado neurológico com tempo para suas dúvidas.",
  lede: "A Dra. Kael ajuda você a compreender os sintomas que afetam o cérebro e o sistema nervoso, desde as primeiras dúvidas até o acompanhamento contínuo.",
  biography:
    "A Dra. Sofia Kael é neurologista clínica na Kael Neurologia, em São Paulo. Suas consultas começam com uma conversa sobre os sintomas e como eles afetam o dia a dia. Ela avalia seu histórico de saúde e examina o funcionamento do sistema nervoso. A Dra. Kael explica quando exames complementares podem ajudar e apresenta as opções de cuidado em uma linguagem clara.",
  pullQuote: "Uma conversa atenta ajuda a compreender os sintomas.",
} as const satisfies SectionContent & { biography: string; pullQuote: string };

export const CONDITIONS_SECTION = {
  eyebrow: SECTIONS[1].label,
  headline: "Condições tratadas pela Dra. Kael.",
  lede: "A Dra. Kael acompanha as condições abaixo. Conheça os sintomas e selecione “Veja no cérebro” para explorar as estruturas envolvidas.",
  seeInBrain: "Veja no cérebro",
  structuresLabel: "Estruturas",
} as const satisfies SectionContent & {
  seeInBrain: string;
  structuresLabel: string;
};

export type ExplorerContent = SectionContent & {
  hint: string;
  canvasDescription: string;
  loading: string;
  fallback: string;
  tapToExplore: string;
  exit: string;
  structureIndex: string;
  closePanel: string;
  conditionsLabel: string;
  structuresLabel: string;
  clear: string;
  backTo: string;
  toolsLabel: string;
  tools: {
    rotate: string;
    slice: string;
    split: string;
    xray: string;
    isolate: string;
    reset: string;
  };
  slice: {
    /** The segmented control's group label. */
    orientation: string;
    /** Each axis's name (also the readout's) and, beneath it, the halves it separates in plain English. */
    axes: Record<SliceAxis, { name: string; plane: string }>;
    /** The slider's label. */
    position: string;
  };
};

export const EXPLORER = {
  eyebrow: SECTIONS[2].label,
  headline: "Entenda o cérebro",
  lede: "Selecione uma estrutura para conhecer sua função e as condições tratadas pela Dra. Kael. Gire o cérebro ou use as ferramentas para explorar seu interior.",
  hint: "Arraste para girar · Clique em uma estrutura",
  canvasDescription:
    "Um cérebro interativo em três dimensões. Selecione uma estrutura no índice para ler sua descrição e conhecer as condições relacionadas.",
  loading: "Carregando modelo",
  fallback:
    "Entenda o cérebro pelo índice de estruturas. Cada estrutura tem uma descrição e uma lista de condições relacionadas.",
  tapToExplore: "Toque para explorar",
  exit: "Sair",
  structureIndex: "Índice de estruturas",
  closePanel: "Fechar painel",
  conditionsLabel: "Condições tratadas pela Dra. Kael nesta estrutura",
  structuresLabel: "Estruturas",
  clear: "Limpar",
  backTo: "Voltar para",
  toolsLabel: "Ferramentas",
  tools: {
    rotate: "Girar",
    slice: "Corte",
    split: "Separar",
    xray: "Raio X",
    isolate: "Isolar",
    reset: "Redefinir",
  },
  slice: {
    orientation: "Orientação do corte",
    axes: {
      sagittal: { name: "Sagital", plane: "esquerda e direita" },
      coronal: { name: "Coronal", plane: "frente e trás" },
      axial: { name: "Axial", plane: "superior e inferior" },
    },
    position: "Posição do corte",
  },
} as const satisfies ExplorerContent;

export type VisitStep = { title: string; body: string };

export const FIRST_VISIT = {
  eyebrow: SECTIONS[3].label,
  headline: "O que esperar da sua primeira consulta.",
  lede: "Você terá tempo para falar sobre suas preocupações, tirar dúvidas e conversar sobre os próximos passos do seu cuidado.",
  steps: [
    {
      title: "Antes de chegar",
      body: "Traga uma lista dos medicamentos que você usa e os resultados de exames anteriores. Anote quando os sintomas começaram, o que parece influenciá-los e as perguntas que deseja fazer.",
    },
    {
      title: "Durante a consulta",
      body: "Você vai conversar sobre seus sintomas e como eles afetam o dia a dia. A Dra. Kael avaliará seu histórico de saúde e examinará funções como movimento, equilíbrio e sensibilidade, explicando cada etapa.",
    },
    {
      title: "Exames, se forem necessários",
      body: "Se forem necessárias mais informações, você e a Dra. Kael conversarão sobre quais exames podem ajudar e por quê. Você poderá tirar dúvidas sobre cada exame antes de decidir o próximo passo.",
    },
    {
      title: "Um plano para seguir",
      body: "Você vai revisar os achados com a Dra. Kael e conversar sobre as opções de cuidado. Juntos, vocês definirão os próximos passos, incluindo como receber os resultados dos exames e quando retornar.",
    },
  ],
} as const satisfies SectionContent & { steps: readonly VisitStep[] };

export type TrainingEntry = { years: string; text: string };
export type Publication = { title: string; venue: string; year: string };

export const CREDENTIALS = {
  eyebrow: "Formação e pesquisa",
  headline: "Formação e pesquisa em neurologia clínica.",
  lede: "A formação e a pesquisa da Dra. Kael se concentram na avaliação cuidadosa e na comunicação clara no atendimento neurológico.",
  trainingLabel: "Formação e vínculos institucionais",
  trainingCallout: "Prática clínica e pesquisa",
  publicationsLabel: "Publicações selecionadas",
  training: [
    {
      years: "2006–2010",
      text: "Graduação em Medicina, Faculdade de Medicina Talvenwick.",
    },
    {
      years: "2010–2014",
      text: "Residência em Neurologia, Hospital de Ensino Orseldane.",
    },
    {
      years: "2014–atual",
      text: "Neurologia clínica, Kael Neurologia. Pesquisadora associada ao Instituto Veylford de Estudos Neurológicos.",
    },
  ],
  publications: [
    {
      title: "Como abordar a incerteza na primeira consulta neurológica",
      venue: "Revista Talvenwick de Neurologia Clínica",
      year: "2023",
    },
    {
      title: "Diários de sintomas na avaliação de cefaleias recorrentes",
      venue: "Revista Veylford de Prática Neurológica",
      year: "2021",
    },
  ],
} as const satisfies SectionContent & {
  trainingLabel: string;
  trainingCallout: string;
  publicationsLabel: string;
  training: readonly TrainingEntry[];
  publications: readonly Publication[];
};

export type ContactFormContent = {
  labels: {
    name: string;
    email: string;
    phone: string;
    reason: string;
    preferredTime: string;
  };
  preferredTimes: { morning: string; afternoon: string; noPreference: string };
  errors: {
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    phoneInvalid: string;
    reasonRequired: string;
  };
  submit: string;
  success: { title: string; body: string };
};

export const CONTACT = {
  eyebrow: SECTIONS[4].label,
  headline: "Comece com uma conversa.",
  lede: "Conte à Dra. Kael o que preocupa você e qual o melhor horário para receber uma ligação. A Kael Neurologia ajudará a agendar sua primeira consulta.",
  addressLabel: "Endereço",
  addressLines: [
    "Rua das Acácias do Vale, 240, sala 302",
    "Jardim Aurora · São Paulo, SP",
  ],
  phoneLabel: "Telefone",
  phone: "(11) 0000-0142",
  phoneHref: "tel:+551100000142",
  hoursLabel: "Horário de atendimento",
  hours: [{ days: "Segunda a sexta", time: "9h às 17h" }],
  form: {
    labels: {
      name: "Nome",
      email: "E-mail",
      phone: "Telefone (opcional)",
      reason: "Motivo da consulta",
      preferredTime: "Horário de preferência",
    },
    preferredTimes: {
      morning: "Manhã",
      afternoon: "Tarde",
      noPreference: "Sem preferência",
    },
    errors: {
      nameRequired: "Informe seu nome.",
      emailRequired: "Informe seu e-mail.",
      emailInvalid: "Informe um e-mail válido.",
      phoneInvalid: "Informe um telefone válido ou deixe este campo em branco.",
      reasonRequired: "Informe o motivo da consulta.",
    },
    submit: "Agende uma consulta",
    success: {
      title: "Agradecemos seu contato.",
      body: "A Kael Neurologia entrará em contato por telefone em até dois dias úteis.",
    },
  },
} as const satisfies SectionContent & {
  addressLabel: string;
  addressLines: readonly string[];
  phoneLabel: string;
  phone: string;
  phoneHref: string;
  hoursLabel: string;
  hours: readonly { days: string; time: string }[];
  form: ContactFormContent;
};

export const FOOTER = {
  wordmark: NAV.wordmark,
  navigationLabel: "Navegação do rodapé",
  modelCredits: "Créditos do modelo",
  attribution:
    "Modelo do cérebro: Z-Anatomy – The libre 3D atlas of anatomy e BodyParts3D (DBCLS), sob licença CC BY-SA 4.0.",
  disclaimer:
    "A Dra. Sofia Kael e a Kael Neurologia são fictícias. O endereço e o telefone também são fictícios. Este site é um projeto de design e não oferece orientação médica.",
} as const satisfies Record<string, string>;
