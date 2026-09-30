import { placeholder } from "@/content/placeholder";

export type SectionLink = { id: string; label: string };

export const SECTIONS = [
  { id: "about", label: "About" },
  { id: "conditions", label: "Conditions" },
  { id: "brain-explorer", label: "Brain Explorer" },
  { id: "first-visit", label: "First visit" },
  { id: "contact", label: "Contact" },
] as const satisfies readonly SectionLink[];

export type SectionId = (typeof SECTIONS)[number]["id"];
export type SectionContent = { eyebrow: string; headline: string; lede: string };

export const NAV = {
  wordmark: "Kael Neurology",
  consultation: "Book a consultation",
  menu: "Menu",
  closeMenu: "Close menu",
  navigationLabel: "Main navigation",
} as const satisfies Record<string, string>;

export type HeroContent = {
  eyebrow: string;
  headline: { before: string; accent: string; after: string };
  lede: string;
  consultation: string;
  explore: string;
  portraitCallout: string;
};

export const HERO = {
  eyebrow: "Dr. Sofia Kael · Neurologist",
  headline: {
    before: placeholder("Lorem ipsum dolor sit "),
    accent: placeholder("amet"),
    after: placeholder(", consectetur adipiscing elit."),
  },
  lede: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae sapien ut felis tempor commodo."),
  consultation: NAV.consultation,
  explore: "Explore the brain",
  portraitCallout: "Dr. Sofia Kael, MD · Neurologist",
} as const satisfies HeroContent;

export const ABOUT = {
  eyebrow: SECTIONS[0].label,
  headline: placeholder("Lorem ipsum dolor sit amet."),
  lede: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec luctus sem at neque facilisis, vitae faucibus arcu posuere."),
  biography: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Praesent vitae purus non erat faucibus dignissim."),
  pullQuote: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut neque vitae erat commodo tincidunt."),
} as const satisfies SectionContent & { biography: string; pullQuote: string };

export const CONDITIONS_SECTION = {
  eyebrow: SECTIONS[1].label,
  headline: placeholder("Lorem ipsum dolor sit amet, consectetur."),
  lede: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae justo at nulla consequat tincidunt."),
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
  headline: placeholder("Lorem ipsum dolor sit."),
  lede: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vitae neque nec lacus tincidunt posuere."),
  steps: [
    { title: placeholder("Lorem ipsum dolor."), body: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porta nisl a enim aliquam, sed cursus massa pretium.") },
    { title: placeholder("Lorem ipsum sit amet."), body: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi at ante vel nulla tristique aliquam.") },
    { title: placeholder("Lorem ipsum consectetur."), body: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec non turpis eget metus faucibus vestibulum.") },
    { title: placeholder("Lorem ipsum adipiscing."), body: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam sit amet dolor vitae felis feugiat consequat.") },
  ],
} as const satisfies SectionContent & { steps: readonly VisitStep[] };

export type TrainingEntry = { years: string; text: string };
export type Publication = { title: string; venue: string; year: string };

export const CREDENTIALS = {
  eyebrow: "Credentials & research",
  headline: placeholder("Lorem ipsum dolor sit amet, adipiscing."),
  lede: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur quis velit vel arcu mollis facilisis."),
  trainingLabel: "Training & affiliations",
  publicationsLabel: "Selected publications",
  training: [
    { years: placeholder("Lorem ipsum"), text: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit.") },
    { years: placeholder("Lorem ipsum dolor"), text: placeholder("Lorem ipsum dolor sit amet, sed consectetur adipiscing elit.") },
    { years: placeholder("Lorem ipsum sit"), text: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.") },
  ],
  publications: [
    { title: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing."), venue: placeholder("Lorem ipsum dolor sit"), year: placeholder("Lorem") },
    { title: placeholder("Lorem ipsum dolor sit amet, sed do eiusmod."), venue: placeholder("Lorem ipsum sit amet"), year: placeholder("Ipsum") },
  ],
} as const satisfies SectionContent & {
  trainingLabel: string;
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
  headline: placeholder("Lorem ipsum dolor amet."),
  lede: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean at nibh id erat consequat interdum."),
  addressLabel: "Address",
  addressLines: [placeholder("Lorem ipsum dolor sit amet"), placeholder("Lorem ipsum consectetur adipiscing")],
  phoneLabel: "Phone",
  phone: placeholder("Lorem ipsum"),
  hoursLabel: "Hours",
  hours: [{ days: placeholder("Lorem ipsum dolor"), time: placeholder("Lorem ipsum sit") }],
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
    success: { title: placeholder("Lorem ipsum."), body: placeholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus at felis a justo finibus blandit.") },
  },
} as const satisfies SectionContent & {
  addressLabel: string;
  addressLines: readonly string[];
  phoneLabel: string;
  phone: string;
  hoursLabel: string;
  hours: readonly { days: string; time: string }[];
  form: ContactFormContent;
};

export const FOOTER = {
  wordmark: NAV.wordmark,
  navigationLabel: "Footer navigation",
  attribution: "Brain model: Z-Anatomy – The libre 3D atlas of anatomy, and BodyParts3D (DBCLS), licensed CC BY-SA 4.0.",
  disclaimer: "Dr. Sofia Kael and Kael Neurology are fictional. This site is a design project and does not provide medical advice.",
} as const satisfies Record<string, string>;
