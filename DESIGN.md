# DESIGN.md: Kael Neurology

The style guide for the Kael Neurology site. Read `CONTEXT.md` for vocabulary; this file uses its terms (Visitor, Structure, Condition, Slice, Split, X-ray, Isolate).

---

## 1. Principles

1. **A real practice, crafted like a showcase.** Every page choice must be believable for a real neurologist. The level of craft is what sets it apart, not gimmicks.
2. **Editorial, not clinical-template.** Aim for the feel of a premium magazine or a medical-journal essay. Avoid healthcare blue, stock smiles, rounded cards and gradient heroes.
3. **The brain is the payoff.** The page is calm and quiet so the Brain Explorer lands hard. Live 3D appears only in the Brain Explorer.
4. **Depth belongs to the specimen.** The page is flat: hairlines, paper, ink. The only thing with real depth, light and shadow is the brain.
5. **Anatomy-plate language.** Leader-line callouts, Latin names, mono coordinates. The visual vocabulary comes from anatomical plates and imaging readouts.

---

## 2. Color

Light theme only. There is no dark mode; strip the scaffold's `.dark` tokens.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F6F4F0` | Page background. A slightly cool porcelain white, not cream. |
| `--paper-2` | `#ECE8E1` | Brain Explorer stage, alternate bands, input fills on hover |
| `--surface` | `#FFFFFF` | Structure panel, bottom sheet, form success card |
| `--ink` | `#1B1918` | Primary text, section rules, icons |
| `--ink-soft` | `#5D5752` | Secondary text, mono labels, leader lines |
| `--rule` | `#D6D0C7` | Hairline borders and dividers |
| `--oxblood` | `#6E1F24` | The single accent: primary buttons, links on hover, italic headline emphasis, selected Structures, Slice plane frame |
| `--oxblood-deep` | `#56171B` | Primary button hover/active |
| `--oxblood-tint` | `#F0E2E0` | Condition chips, selected rows in the Structure index |

**3D material colors** (used in the Brain Explorer only):

| Token | Hex | Use |
|---|---|---|
| `--porcelain` | `#EFEBE4` | Base brain material |
| `--porcelain-cut` | `#B9AFA3` | Faces exposed by Slice, the "inside of the cast" |
| `--porcelain-ghost` | `#EFEBE4` at 8% opacity | Non-isolated Structures during Isolate |

**Rules**
- Oxblood is the only chromatic color on the page. Use it sparingly: one italic word per headline at most, and one primary button per viewport.
- Text contrast is at least 4.5:1. `--ink-soft` on `--paper` passes; never put `--ink-soft` on `--paper-2` for text under 14px.
- Semantic colors (form errors) use `--oxblood` plus an icon and text. There is no extra red or green.

---

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| Display | **Instrument Serif** (400, plus italic) | Headlines, Structure names, pull quotes, wordmark. It has one weight, so hierarchy comes from size only. |
| Body / UI | **Geist** (300–600) | Paragraphs, buttons, form fields, navigation |
| Utility | **Geist Mono** (400–500) | Eyebrows, labels, leader-line captions, Latin names (italic), coordinates, years |

Load through `next/font/google` in `fonts/index.ts`. Remove Inter.

**Scale**

| Token | Size | Line height | Tracking | Face |
|---|---|---|---|---|
| `display-xl` | `clamp(56px, 8vw, 128px)` | 0.95 | −0.015em | Serif. Hero headline only. |
| `display-l` | `clamp(40px, 5.5vw, 80px)` | 1.0 | −0.015em | Serif. Section headlines. |
| `display-m` | `clamp(32px, 3.5vw, 44px)` | 1.05 | −0.01em | Serif. Structure name, Condition names, pull quotes. |
| `body-l` | 19px | 1.6 | 0 | Geist 400. Ledes. |
| `body` | 16px | 1.65 | 0 | Geist 400 |
| `body-s` | 14px | 1.55 | 0 | Geist 400. Captions, panel text. |
| `label` | 11–12px | 1.3 | +0.12em, uppercase | Geist Mono 400/500 |
| `latin` | 13px | 1.3 | 0, italic | Geist Mono 400 |

**Rules**
- Headlines use `text-wrap: balance`. Running text stays at most about 65ch wide.
- Italic serif in `--oxblood` marks the single emphasized word or phrase in a headline, e.g. "Clear answers for the brain's *hardest* questions."
- Numbers that align (years, coordinates, hours) use `tabular-nums`.
- Never set body text in the serif, and never set headlines in Geist.

---

## 4. Layout and spacing

- **Grid:** 12 columns and a max content width of 1280px. The side gutter is `clamp(16px, 4vw, 56px)`, and column gaps are `clamp(16px, 2vw, 32px)`.
- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192. Section vertical padding is `clamp(96px, 12vw, 192px)`.
- **Section opening:** every section starts with a full-width 1px `--ink` rule, then a mono `label` eyebrow naming the section ("About", "Conditions"), then the `display-l` headline. Sections are **not** numbered. Only the First visit steps get numbers, because they are a real sequence.
- **Asymmetry:** favor offset compositions, e.g. a headline in columns 1–7 and a lede in columns 8–12. Don't center everything.
- Use `gap` in flex and grid for spacing between siblings, not per-element margins.

---

## 5. Shape, borders, depth

- **Surfaces are sharp** (`radius: 0`): panels, sheets, images, inputs and the Structure index.
- **Only buttons and chips are pills** (`radius: 999px`).
- **Borders:** 1px `--rule` for containers and 1px `--ink` for section rules. There are no double borders or accent side-bars.
- **No drop shadows on the page.** The only exceptions are inside the Brain Explorer: the brain's own lighting and a soft contact shadow under it, plus a hairline and `--surface` fill for floating panels.
- Set `--radius: 0` in the shadcn tokens and apply pills explicitly.

---

## 6. Signature element: the leader-line callout

A callout, borrowed from anatomical plates, is the site's recurring visual motif.

- **Anatomy:** an 8px ring (1.5px `--oxblood` stroke, hollow) at the anchor point, a 1px `--ink-soft` line with at most one bend, and a `label`-style mono uppercase caption.
- **In the Brain Explorer:** the callout appears on hover or focus of a Structure. The line runs from the Structure's surface point to a caption placed in the stage margin. It draws in over 250ms.
- **Elsewhere, decoratively:**
  - on the hero portrait, e.g. a callout reading "Dr. Sofia Kael, MD · Neurologist"
  - beside the Credentials timeline
  - in brain-derived section art
- Use at most two decorative callouts per viewport outside the Brain Explorer.

---

## 7. Motion

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast` | 200ms |
| `--dur-base` | 400ms |
| `--dur-slow` | 700ms |
| `--dur-camera` | 900ms |

- **On the page, motion is restrained:** elements fade in and rise 12px once as they enter the viewport, with at most 60ms stagger within a group. Content is fully visible at rest with no JS. There's no parallax, no split-text headlines and no scroll-jacking.
- **In the Brain Explorer, motion is rich:**
  - eased camera moves between states (`--dur-camera`)
  - hemispheres slide apart on Split
  - live Slice dragging
  - a cross-fade to frosted glass on X-ray
  - a slow idle rotation until the first interaction, which then stops it for good
- **`prefers-reduced-motion`** turns off reveals and idle rotation, and camera moves become instant cuts.

---

## 8. Page structure

A single page with anchor navigation, in this order:

### Navigation
A sticky top bar on `--paper` with a hairline bottom border that appears after scrolling. The wordmark "Kael Neurology" is set in the serif on the left. Anchor links in mono `label` style sit in the center or right: About, Conditions, Brain Explorer, First visit, Contact. A "Book a consultation" pill sits on the far right. On mobile the links move into a full-screen sheet with the links in the serif at `display-m`.

### 1. Hero
- The headline in `display-xl` spans roughly columns 1–7, with one oxblood italic word.
- Below it: a one-paragraph `body-l` lede, the primary CTA "Book a consultation", and a secondary underlined link "Explore the brain" that scrolls to the Brain Explorer.
- A tall 4:5 **portrait of Dr. Kael** sits in columns 8–12, carrying a decorative leader-line callout.
- The hero is sized to its content, not locked to 100vh.

### 2. About
A second portrait, a candid 3/4 crop from the same identity. A short bio in third person, plus one pull quote in serif italic at `display-m`.

### 3. Conditions
- Shown as an **editorial index, not cards**. Each Condition is a row separated by hairlines, with three parts:
  - the Condition name in the serif at `display-m`
  - a one-line plain description
  - a mono line listing the involved Structures
  - the action **"See it in the brain →"**
- That action scrolls to the Brain Explorer and Isolates the involved Structures (see §9).

### 4. Brain Explorer
See §9.

### 5. First visit
Three or four numbered steps (the one place numbering is allowed), such as: before your visit, the consultation, tests if needed, the follow-up plan. Written in second person.

### 6. Credentials & research
Two columns:
- **Training & affiliations:** a timeline with mono years.
- **Selected publications:** title, venue and year.

All institutions, hospitals and journals are **fictional**. Never attribute invented papers or positions to real journals or real hospitals.

### 7. Contact
- **Form:** name, email, phone (optional), reason for visit, preferred time. Inputs have a bottom border only, with mono `label` labels above them.
- **On submit:** client-side validation, then a success state in a `--surface` panel ("Thank you. Kael Neurology will call you within two business days."). **Nothing is sent.**
- **Beside the form:** the fictional Boston address, hours with tabular numbers, and phone. No map embed.

### 8. Footer
The wordmark, the anchor links, and two required lines in `body-s` `--ink-soft`:
- "Brain model: Z-Anatomy – The libre 3D atlas of anatomy, and BodyParts3D (DBCLS), licensed CC BY-SA 4.0."
- "Dr. Sofia Kael and Kael Neurology are fictional. This site is a design project and does not provide medical advice."

---

## 9. Brain Explorer

### Stage
- **Desktop:** full-bleed and roughly `100svh`, with a `--paper-2` background, a 1px `--ink` rule above, and the section eyebrow and headline overlaid top-left.
- **Brain placement:** centered, starting in a three-quarter left view with a slow idle rotation, lit by soft hemispheric light and a soft contact shadow.
- **First-use hint:** the leader-line caption "Drag to rotate · Click a Structure", which fades out after the first interaction.

### Model and material
- The model is the Z-Anatomy GLB (see `docs/adr/0001-z-anatomy-brain-model.md`), with vessels, meninges and cranial nerves hidden.
- **Porcelain specimen:** a matte `--porcelain` material with soft roughness and gentle ambient occlusion, like a museum plaster cast. There are no realistic tissue textures.
- Structures take color only when selected or linked; they turn `--oxblood`.
- Faces cut by Slice show `--porcelain-cut`.
- Loads lazily as the section approaches. The placeholder is a line drawing of the brain with a mono readout: "Loading specimen · 62%".

### Structures (initial list, around 20)
A Structure is the bilateral pair: selecting it highlights both sides.

Frontal lobe · Parietal lobe · Temporal lobe · Occipital lobe · Insula · Precentral gyrus (motor cortex) · Postcentral gyrus (sensory cortex) · Cingulate gyrus · Corpus callosum · Thalamus · Hypothalamus · Hippocampus · Amygdala · Basal ganglia · Substantia nigra · Ventricles · Midbrain · Pons · Medulla oblongata · Cerebellum

### Tools
The tool rail sits at the bottom center: a hairline-bordered `--surface` bar with icon plus mono label buttons. Tool buttons use `aria-pressed`.

| Tool | Behavior |
|---|---|
| **Rotate** | Always on: drag to orbit, scroll or pinch to zoom (clamped). Not a button. |
| **Slice** *(signature)* | A cutting plane with a segmented control (Sagittal / Coronal / Axial) and a slider. The plane is drawn as a hairline `--oxblood` frame. A mono readout shows e.g. "Coronal · y = −22 mm". |
| **Split** | The hemispheres slide apart along the midline, and the camera swings to show the medial surface and corpus callosum. |
| **X-ray** | The cortex cross-fades to frosted translucent porcelain, and deep Structures stay opaque. |
| **Isolate** | Available when a Structure is selected: every other Structure fades to `--porcelain-ghost`. |
| **Reset** | Returns the camera and all tools to the initial state. |

Tools can combine, e.g. X-ray + Isolate, or Slice while Split.

### Interaction
- **Hover or focus:** a leader-line callout with the Structure's name.
- **Select (click, tap or index):** the Structure turns `--oxblood` and the camera eases to frame it. The **Structure panel** slides in from the right, 360–400px wide, with a `--surface` fill and a hairline border. It contains:
  - the Structure name in the serif at `display-m`
  - the Latin name in italic mono
  - two or three plain-English sentences on what it does
  - a label "Conditions Dr. Kael treats here" with `--oxblood-tint` chips. Each chip scrolls to that Condition's row in the Conditions section.
  - an Isolate toggle
- **Structure index:** a collapsible list of all Structures in mono, pinned top-right of the stage. It's fully keyboard-navigable and is the accessible way to reach any Structure.
- **Arriving from a Condition ("See it in the brain"):**
  - The involved Structures are Isolated and tinted `--oxblood`.
  - The panel shows the **Condition** instead: its name, a short description, and the involved Structures as selectable rows.
  - A mono "Clear" link returns to free exploration.

### Condition ↔ Structure map (initial content)

| Condition | Structures |
|---|---|
| Epilepsy (temporal lobe) | Hippocampus, Temporal lobe, Amygdala |
| Alzheimer's disease | Hippocampus, Temporal lobe, Parietal lobe |
| Parkinson's disease | Substantia nigra, Basal ganglia |
| Essential tremor | Cerebellum, Thalamus |
| Stroke | Precentral gyrus, Frontal lobe, Parietal lobe |
| Migraine | Occipital lobe, Thalamus, Pons |
| Multiple sclerosis | Corpus callosum, Ventricles, Midbrain |
| Hydrocephalus | Ventricles |
| Ataxia | Cerebellum |
| Vertigo | Pons, Medulla oblongata, Cerebellum |

### Mobile
- The stage runs edge to edge with the full toolset.
- **Scroll safety:** before activation, one-finger drags scroll the page. The stage shows a "Tap to explore" caption. After a tap, the canvas captures gestures (one finger rotates, pinch zooms) and an "Exit" button appears top-right.
- **Bottom sheet:**
  - The tool rail becomes a bottom sheet with snap points. In the peek state it shows the tools and the selected Structure's name; expanded, it shows the full Structure panel and the Structure index.
  - The Slice slider lives in the sheet.

### Accessibility
- All Structures are reachable through the Structure index and keyboard.
- Tools are real buttons with labels.
- The canvas has a text description.
- The Structure panel is announced politely.
- Reduced motion is respected (§7).

---

## 10. Components (quick reference)

| Component | Spec |
|---|---|
| **Primary button** | Pill, `--oxblood` fill, `--paper` text, Geist 500 14px, padding 14×20. Hover: `--oxblood-deep`. |
| **Secondary link** | Geist 500, `--ink`, underline offset 4px in `--rule`. Hover: underline turns `--oxblood`. |
| **Chip** | Pill, `--oxblood-tint` fill, `--oxblood` text, Geist 500 12.5px, padding 7×10 |
| **Eyebrow** | Mono `label`, `--ink-soft` |
| **Input** | Bottom border only (1px `--ink-soft`); on focus, 1px `--oxblood` plus the label turns `--oxblood`. Errors are `--oxblood` text below the field. |
| **Focus ring** | `outline: 2px solid var(--oxblood); outline-offset: 3px` on every interactive element |
| **Icons** | lucide, stroke 1.5, 16px in UI and 20px in the tool rail. Always paired with a text label in the tool rail. Never used as decoration or section markers. |

---

## 11. Imagery

- **Only two kinds of imagery:** portraits of Dr. Kael, and brain-derived graphics (line drawings, Slice cross-sections, leader-line diagrams). No stock photos, clinic interiors or illustrations of people.
- **Portraits** are AI-generated from one consistent identity, used in the hero and About.
  - **Setting and light:** natural window light and a soft neutral background.
  - **Wardrobe:** muted, with no white coat and no stethoscope.
  - **Expression:** a calm, direct gaze.
  - **Grade:** a slightly desaturated warm grade that sits on `--paper`.
  - **Crops:** hero 4:5; About 3:4 candid.
- Images have sharp corners and no borders, frames or shadows.

---

## 12. Voice

- **Third person for Dr. Kael** ("Dr. Kael treats…"), **second person for the Visitor** ("You'll leave your first visit with…").
- Plain, calm, precise. Explain any medical term the first time it appears. Latin names only as secondary labels.
- Short sentences, active voice. Buttons say exactly what happens ("Book a consultation", "See it in the brain").
- **Avoid:** "cutting-edge", "state-of-the-art", "holistic", "journey", "world-class", exclamation marks, and promises of cures or outcomes.
- **No testimonials or patient stories.** Fabricated reviews are the one thing that must not look real.

---

## 13. Implementation notes

- Map the tokens into `app/globals.css`. Point shadcn's semantic tokens at them: `--background: paper`, `--foreground: ink`, `--primary: oxblood`, `--primary-foreground: paper`, `--border` and `--input: rule`, `--ring: oxblood`, `--card` and `--popover: surface`, `--muted: paper-2`, `--muted-foreground: ink-soft`, `--radius: 0`.
- Remove the `.dark` block and the `dark` custom variant.
- Fonts: `Instrument_Serif`, `Geist` and `Geist_Mono` from `next/font/google`, exposed as `--font-serif`, `--font-sans` and `--font-mono`.
