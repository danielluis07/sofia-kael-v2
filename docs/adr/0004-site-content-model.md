# Site content model

All site copy and content data are typed TS modules under a root `content/` directory (`@/content/structures`, `@/content/conditions`, `@/content/site`), written with `as const` and `satisfies`. The ids become literal unions (`StructureId`, `ConditionId`) that the reducer, `deriveView` and the URL parser import, so a typo in a Condition's Structures or a missing description fails `tsc`. Server-rendered sections and the client-only Brain Explorer import the same modules, and nothing needs a loader. Anatomy facts stay in `lib/brain/`, and words stay in `content/`, so the GLB build never imports prose and a copy edit never touches the build's input.

## Considered Options

- **JSON.** It's plain data, but the id types have to be recovered with a schema or a cast.
- **MDX or Markdown per Structure/Condition.** This suits long prose, but the copy is 2–3 sentences, and the client-only Explorer would need it serialized through props.
- **One record per Structure in `lib/brain/`, holding facts and copy together.** The build script would import prose, and every copy edit would touch the file that feeds the GLB.
- **Inline copy in section components.** The final copy pass would then mean editing JSX in a dozen places.
- **Markup in strings (`*word*`) or `.tsx` content holding ReactNodes.** Only the hero headline needs inline emphasis, so a structured field beats a parser.

## Modules

- **`lib/brain/structures.ts`** holds the `STRUCTURE_IDS` tuple, the cortex/deep layer and the node mapping (ADR 0002). The tuple's order is the Structure index order: DESIGN.md §9's list, lobes first, then deep Structures, brainstem and cerebellum.
- **`content/structures.ts`** is `Record<StructureId, { name, aka?, latin, description }>`.
  - `name` is short ("Precentral gyrus") and is used in callouts, the Structure index and the Conditions rows' mono line.
  - `aka` is the plain-English gloss ("motor cortex"), shown in the Structure panel.
  - `description` is 2–3 sentences.
- **`content/conditions.ts`** is one ordered array of `{ id, name, oneLiner, description, structures: StructureId[] }`.
  - The array order is the Conditions section order.
  - `oneLiner` (about 10–14 words) is for the Conditions row, and `description` (2–3 sentences) is for the Condition panel.
  - Ids are written by hand and never derived from the name, so renaming a Condition never breaks a shared link: `temporal-lobe-epilepsy`, `alzheimers-disease`, `parkinsons-disease`, `essential-tremor`, `stroke`, `migraine`, `multiple-sclerosis`, `hydrocephalus`, `ataxia`, `vertigo`.
- **The reverse map is derived, never authored:** `conditionsForStructure(id)` returns the Conditions that list a Structure, in Conditions order. It feeds the Structure panel's chips.
- **`content/site.ts`** holds everything else:
  - **`SECTIONS`**: the five nav anchors (`{ id, label }`: About, Conditions, Brain Explorer, First visit, Contact). The nav, the mobile sheet, the footer, each section's `id` and the deep-link code all read it; nothing hard-codes `#brain-explorer`.
  - **One typed object per section**, with plain strings only. The hero headline is `{ before, accent, after }` for its one oxblood italic word. Any other italic, like the pull quote, is styled by its component.
  - **List-like content is typed:**
    - training: `{ years, text }`
    - publications: `{ title, venue, year }`
    - First visit steps: `{ title, body }`
    - contact: `{ addressLines, phone, hours: { days, time }[] }`

## Placeholders and the final copy pass

Placeholder copy is wrapped in `placeholder("Lorem…")`, an identity function from `content/placeholder.ts`. Fictional institutions and journals are wrapped too, so the final pass re-checks each one against DESIGN.md §6's "never real" rule. `bun test` covers four things:

- **Remaining placeholders:** it lists the placeholders that remain, so what's left is a count rather than a grep for "lorem".
- **Explorer copy:** it fails if any Structure or Condition copy is a placeholder. Brain Explorer copy is real English from the start.
- **Structures without Conditions:** it pins the Structures allowed to have no Condition (Insula, Postcentral gyrus, Cingulate gyrus, Hypothalamus). Their Structure panel omits the "Conditions Dr. Kael treats here" block, and any other orphan is a mistake.
- **Id uniqueness:** Condition ids are unique and URL-safe.

## Consequences

- **Amends ADR 0003:** the Condition ↔ Structure map lives in `content/conditions.ts`, as each Condition's `structures`, not in `lib/brain/`. The cortex/deep split stays in `lib/brain/`.
- **Condition ids are public** (`?condition=`, `#condition-<id>`) and shouldn't change once shipped.
- **Who writes the Explorer copy:** the slice that creates `content/structures.ts` and `content/conditions.ts` ships real text. The agent drafts it following DESIGN.md §12. The human reviews it for medical plausibility in the PR against a checklist: no promised outcomes, every medical term explained on first use, and Latin only as a secondary label.
