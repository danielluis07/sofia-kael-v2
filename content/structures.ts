import type { StructureId } from "@/lib/brain/structures";

export type StructureContent = {
  name: string;
  aka?: string;
  latin: string;
  description: string;
};

export const STRUCTURES = {
  "frontal-lobe": {
    name: "Frontal lobe",
    latin: "Lobus frontalis",
    description: "The frontal lobe helps you plan, make decisions and control your behavior. It also supports speech and works with other Structures to guide movement.",
  },
  "parietal-lobe": {
    name: "Parietal lobe",
    latin: "Lobus parietalis",
    description: "The parietal lobe combines information about touch and where your body is in space. It helps you judge distances and direct attention to your surroundings.",
  },
  "temporal-lobe": {
    name: "Temporal lobe",
    latin: "Lobus temporalis",
    description: "The temporal lobe helps you process sounds and understand language. It also works with nearby Structures to form memories and recognize familiar people and objects.",
  },
  "occipital-lobe": {
    name: "Occipital lobe",
    latin: "Lobus occipitalis",
    description: "The occipital lobe processes information arriving from your eyes. It helps you make sense of shapes, colors and movement in what you see.",
  },
  insula: {
    name: "Insula",
    latin: "Insula",
    description: "The insula lies beneath the brain's outer folds and helps you sense what is happening inside your body. It also helps process taste and the emotional experience of pain.",
  },
  "precentral-gyrus": {
    name: "Precentral gyrus",
    aka: "motor cortex",
    latin: "Gyrus precentralis",
    description: "The precentral gyrus is a fold in the brain's outer layer, also called the motor cortex. It sends signals that help you move your body voluntarily, with each side mainly controlling the opposite side of the body.",
  },
  "postcentral-gyrus": {
    name: "Postcentral gyrus",
    aka: "sensory cortex",
    latin: "Gyrus postcentralis",
    description: "The postcentral gyrus is a fold in the brain's outer layer, also called the sensory cortex. It processes touch and information about body position, with each side mainly receiving signals from the opposite side of the body.",
  },
  "cingulate-gyrus": {
    name: "Cingulate gyrus",
    latin: "Gyrus cinguli",
    description: "The cingulate gyrus is a fold on the inner surface of the brain. It helps connect emotions with attention and behavior, and contributes to how you experience pain.",
  },
  "corpus-callosum": {
    name: "Corpus callosum",
    latin: "Corpus callosum",
    description: "The corpus callosum is a broad bundle of nerve fibers connecting the brain's two halves. It lets them share information so they can work together.",
  },
  thalamus: {
    name: "Thalamus",
    latin: "Thalamus",
    description: "The thalamus relays most sensory information to the brain's outer layer for further processing. It also takes part in movement signals and helps regulate alertness and sleep.",
  },
  hypothalamus: {
    name: "Hypothalamus",
    latin: "Hypothalamus",
    description: "The hypothalamus helps regulate body temperature, hunger and thirst. It also controls the release of hormones, chemical messengers that influence functions throughout the body.",
  },
  hippocampus: {
    name: "Hippocampus",
    latin: "Hippocampus",
    description: "The hippocampus helps turn experiences into lasting memories. It also helps you remember places and find your way through familiar surroundings.",
  },
  amygdala: {
    name: "Amygdala",
    latin: "Corpus amygdaloideum",
    description: "The amygdala helps the brain recognize emotionally significant experiences, including possible threats. It works with memory Structures to help you learn from those experiences.",
  },
  "basal-ganglia": {
    name: "Basal ganglia",
    latin: "Nuclei basales",
    description: "The basal ganglia are groups of nerve cells deep inside the brain that help select and regulate movements. They also take part in learning habits through repetition.",
  },
  "substantia-nigra": {
    name: "Substantia nigra",
    latin: "Substantia nigra",
    description: "The substantia nigra contains nerve cells that produce dopamine, a chemical messenger used in movement control. These cells send signals to the basal ganglia, groups of nerve cells that help regulate movement.",
  },
  ventricles: {
    name: "Ventricles",
    latin: "Ventriculi cerebri",
    description: "The ventricles are connected spaces inside the brain filled with cerebrospinal fluid, the liquid that cushions the brain and spinal cord. This fluid circulates through the spaces and around the brain and spinal cord.",
  },
  midbrain: {
    name: "Midbrain",
    latin: "Mesencephalon",
    description: "The midbrain is the upper part of the brainstem, the connection between the brain and spinal cord. It helps control eye movements and responses to sights and sounds.",
  },
  pons: {
    name: "Pons",
    latin: "Pons",
    description: "The pons is part of the brainstem, the connection between the brain and spinal cord. It relays signals involved in movement and helps regulate breathing and sleep.",
  },
  "medulla-oblongata": {
    name: "Medulla oblongata",
    latin: "Medulla oblongata",
    description: "The medulla oblongata is the lowest part of the brainstem, the connection between the brain and spinal cord. It helps control automatic functions such as breathing, heart rate and swallowing.",
  },
  cerebellum: {
    name: "Cerebellum",
    latin: "Cerebellum",
    description: "The cerebellum helps coordinate the timing and accuracy of movements. It also supports balance and helps you learn movement skills through practice.",
  },
} as const satisfies Record<StructureId, StructureContent>;
