export type SectionLink = { id: string; label: string };

export const SECTIONS = [
  { id: "about", label: "About" },
  { id: "conditions", label: "Conditions" },
  { id: "brain-explorer", label: "Brain Explorer" },
  { id: "first-visit", label: "First visit" },
  { id: "contact", label: "Contact" },
] as const satisfies readonly SectionLink[];

export type SectionId = (typeof SECTIONS)[number]["id"];

export function sectionHref(id: SectionId) {
  return `#${id}` as const;
}
export type SectionContent = { eyebrow: string; headline: string; lede: string };

export const NAV = {
  wordmark: "Kael Neurology",
  consultation: "Book a consultation",
  menu: "Menu",
  closeMenu: "Close menu",
  navigationLabel: "Main navigation",
} as const satisfies Record<string, string>;

export type HeroContent = {
  headline: string;
  lede: string;
  consultation: string;
  explore: string;
  portraitCallout: string;
};

export const HERO = {
  headline: "General neurological care.",
  lede: "Dr. Sofia Kael takes time to listen, explain what symptoms may mean, and discuss the next steps with you.",
  consultation: NAV.consultation,
  explore: "Explore the brain",
  portraitCallout: "Dr. Sofia Kael, MD · Neurologist",
} as const satisfies HeroContent;

export const ABOUT = {
  eyebrow: SECTIONS[0].label,
  headline: "Neurological care with time for questions.",
  lede: "Dr. Kael helps people make sense of symptoms affecting the brain and nervous system, from a first concern to ongoing care.",
  biography: "Dr. Sofia Kael is a general clinical neurologist at Kael Neurology in Boston. Her consultations begin with a conversation about symptoms and how they affect everyday life. She reviews your medical history and examines how your nervous system is working. Dr. Kael explains when further tests may help and discusses care options in plain language.",
  pullQuote: "A careful conversation helps make sense of symptoms.",
} as const satisfies SectionContent & { biography: string; pullQuote: string };

export const CONDITIONS_SECTION = {
  eyebrow: SECTIONS[1].label,
  headline: "Conditions Dr. Kael treats.",
  lede: "Dr. Kael provides care for the Conditions below. Read about their symptoms and select 'See it in the brain' to explore the Structures involved.",
  seeInBrain: "See it in the brain",
  structuresLabel: "Structures",
} as const satisfies SectionContent & { seeInBrain: string; structuresLabel: string };

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
  tools: { rotate: string; slice: string; split: string; xray: string; isolate: string; reset: string };
  slice: { sagittal: string; coronal: string; axial: string; position: string };
};

export const EXPLORER = {
  eyebrow: SECTIONS[2].label,
  headline: "Explore the brain",
  lede: "Select a Structure to learn what it does and which Conditions Dr. Kael treats. Rotate the brain or use the tools to see inside.",
  hint: "Drag to rotate · Click a Structure",
  canvasDescription: "An interactive three-dimensional brain. Select a Structure using the Structure index to read its description and related Conditions.",
  loading: "Loading specimen",
  fallback: "Explore the brain using the Structure index. Each Structure has a description and a list of related Conditions.",
  tapToExplore: "Tap to explore",
  exit: "Exit",
  structureIndex: "Structure index",
  closePanel: "Close panel",
  conditionsLabel: "Conditions Dr. Kael treats here",
  structuresLabel: "Structures",
  clear: "Clear",
  backTo: "Back to",
  toolsLabel: "Tools",
  tools: { rotate: "Rotate", slice: "Slice", split: "Split", xray: "X-ray", isolate: "Isolate", reset: "Reset" },
  slice: {
    sagittal: "Sagittal (left and right)",
    coronal: "Coronal (front and back)",
    axial: "Axial (upper and lower)",
    position: "Slice position",
  },
} as const satisfies ExplorerContent;

export type VisitStep = { title: string; body: string };

export const FIRST_VISIT = {
  eyebrow: SECTIONS[3].label,
  headline: "What to expect at your first visit.",
  lede: "You’ll have time to explain your concerns, ask questions, and discuss the next steps in your care.",
  steps: [
    { title: "Before you arrive", body: "Bring a list of your medications and any previous test results. You can note when your symptoms began, what seems to affect them, and the questions you want to ask." },
    { title: "Your consultation", body: "You’ll discuss your symptoms and how they affect everyday life. Dr. Kael will review your medical history and examine functions such as your movement, balance, and sensation, explaining each part as you go." },
    { title: "Tests, if you need them", body: "If further information would help, you’ll discuss which tests may be useful and why. You’ll have a chance to ask about what a test involves before deciding on the next step." },
    { title: "A plan to take with you", body: "You’ll review the findings with Dr. Kael and discuss your care options. Together, you’ll agree on the next steps, including how you’ll receive any test results and when to follow up." },
  ],
} as const satisfies SectionContent & { steps: readonly VisitStep[] };

export type TrainingEntry = { years: string; text: string };
export type Publication = { title: string; venue: string; year: string };

export const CREDENTIALS = {
  eyebrow: "Credentials & research",
  headline: "Training and research in clinical neurology.",
  lede: "Dr. Kael’s training and research focus on careful assessment and clear communication in everyday neurological care.",
  trainingLabel: "Training & affiliations",
  trainingCallout: "Clinical practice & research",
  publicationsLabel: "Selected publications",
  training: [
    { years: "2006–2010", text: "Doctor of Medicine, Talvenwick School of Medicine." },
    { years: "2010–2014", text: "Neurology residency, Orseldane Teaching Hospital." },
    { years: "2014–present", text: "General clinical neurology, Kael Neurology. Research affiliate, Veylford Institute for Neurological Studies." },
  ],
  publications: [
    { title: "Discussing uncertainty in the first neurological consultation", venue: "Talvenwick Journal of Clinical Neurology", year: "2023" },
    { title: "Symptom diaries in the assessment of recurring headache", venue: "Veylford Review of Neurological Practice", year: "2021" },
  ],
} as const satisfies SectionContent & {
  trainingLabel: string;
  trainingCallout: string;
  publicationsLabel: string;
  training: readonly TrainingEntry[];
  publications: readonly Publication[];
};

export type ContactFormContent = {
  labels: { name: string; email: string; phone: string; reason: string; preferredTime: string };
  preferredTimes: { morning: string; afternoon: string; noPreference: string };
  errors: { nameRequired: string; emailRequired: string; emailInvalid: string; phoneInvalid: string; reasonRequired: string };
  submit: string;
  success: { title: string; body: string };
};

export const CONTACT = {
  eyebrow: SECTIONS[4].label,
  headline: "Start with a conversation.",
  lede: "Tell Dr. Kael about your concerns and when a call would suit you. Kael Neurology will help you arrange your first visit.",
  addressLabel: "Address",
  addressLines: ["24 Aldermere Lane, Suite 300", "Boston, MA 02116"],
  phoneLabel: "Phone",
  phone: "(617) 555-0142",
  phoneHref: "tel:+16175550142",
  hoursLabel: "Hours",
  hours: [{ days: "Monday–Friday", time: "9:00 am–5:00 pm" }],
  form: {
    labels: { name: "Name", email: "Email", phone: "Phone (optional)", reason: "Reason for visit", preferredTime: "Preferred time" },
    preferredTimes: { morning: "Morning", afternoon: "Afternoon", noPreference: "No preference" },
    errors: {
      nameRequired: "Enter your name.",
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter a valid email address.",
      phoneInvalid: "Enter a valid phone number or leave this field empty.",
      reasonRequired: "Enter a reason for your visit.",
    },
    submit: "Book a consultation",
    success: { title: "Thank you.", body: "Kael Neurology will call you within two business days." },
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
  navigationLabel: "Footer navigation",
  modelCredits: "Model credits",
  attribution: "Brain model: Z-Anatomy – The libre 3D atlas of anatomy, and BodyParts3D (DBCLS), licensed CC BY-SA 4.0.",
  disclaimer: "Dr. Sofia Kael and Kael Neurology are fictional. This site is a design project and does not provide medical advice.",
} as const satisfies Record<string, string>;
