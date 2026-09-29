# Brain Explorer state model

All Brain Explorer state lives in one pure reducer, `explorerReducer(state, action)` in `lib/brain/explorer-state.ts`, and one pure selector, `deriveView(state)`, that turns it into what each Structure-side looks like and where the camera should go. The canvas only renders `deriveView`'s output, so every rule below is tested with `bun test` and no DOM or WebGL. The state sits in a small external store (`useSyncExternalStore`, or zustand wrapping the same reducer), so the tool rail, the panel, the Structure index and the scene share it without re-rendering the whole tree.

## Considered Options

- **zustand as the model itself.** It's convenient inside `useFrame`, but the rules would end up spread across setters. It is still fine as the store around the reducer.
- **XState.** An explicit statechart, but the state is mostly independent flags plus one exclusive Focus, which a statechart only makes wordier. It also adds a dependency.
- **Multi-select of Structures.** Rejected: a Condition is the only way to highlight several Structures at once.
- **Slice plane fixed in world space during Split.** A sagittal cut at x = 0 would hit the empty gap. The plane is anatomical instead.

## State

```ts
type Focus =
  | { kind: "none" }
  | { kind: "structure"; id: StructureId; via?: ConditionId }
  | { kind: "condition"; id: ConditionId };

type ExplorerState = {
  focus: Focus;
  isolate: boolean;          // only takes effect while focus is set
  xray: boolean;
  split: boolean;
  slice: { on: boolean; axis: "sagittal" | "coronal" | "axial"; mm: number };
  hovered: StructureId | null;
  camera: { intent: "home" | "frame" | "medial"; seq: number };
  touched: boolean;          // first interaction happened
};
```

Initial state: focus none, every tool off, Slice Coronal at 0 mm, camera `home`, `touched` false.

## Rules

- **Tools are independent.** Slice, Split, X-ray and Isolate are separate flags, and every combination is legal. The model never forbids a mix; `deriveView` settles visual conflicts.
- **Focus is exclusive.** Selecting a Structure (canvas click, tap, Structure index) or arriving from a Condition replaces the current Focus; they never stack.
- **Isolate** follows the Focus. With a Structure focused, the Visitor toggles it (rail or panel), and selecting another Structure moves the isolation to it. Arriving at a Condition turns it on; the Visitor may turn it off, which keeps the Condition's Structures tinted without ghosting the rest. Clearing the Focus turns it off. With no Focus the button is `aria-disabled`.
- **Inside a Condition focus**, selecting one of its Structures (canvas or a panel row) switches to `{ kind: "structure", id, via: conditionId }`. The Structure panel shows a mono "← <Condition>" link back to the Condition focus. Isolate carries over and now isolates that Structure. `via` never goes into the URL, so after a reload the back link is simply absent.
- **Clearing.** The Condition panel's "Clear", the panel's close control and Esc all dispatch `clearFocus`: focus none, Isolate off. Slice, Split, X-ray and the camera stay where they are, and the URL params are removed with `replaceState`. Clicking empty background or a ghost does nothing, so a drag that ends off the brain never deselects. Esc clears the Focus first; what Esc does for mobile gesture capture is left to the mobile work.
- **Reset** returns everything to the initial state (focus, Isolate, all tools, Slice back to Coronal 0 mm, camera `home`, URL params removed), except that `touched` stays true: the idle rotation and the first-use hint never come back. Without a Reset, Slice keeps its axis and position when toggled off and on.
- **First interaction.** `touched` is set by any orbit drag or zoom, any selection, any tool toggle and any deep-link arrival. Hover doesn't count. It stops the idle rotation and fades the hint for good.
- **Hover.** `hovered` holds one Structure, fed by both canvas pointer hover and keyboard focus in the Structure index; the latest source wins. One callout at a time, naming the Structure, not the side. Non-pickable Structures never get one. Touch has no hover: a tap selects.

## deriveView: look per Structure-side

First matching rule wins:

| # | Condition | Look | Slice cap | Pickable |
|---|---|---|---|---|
| 1 | In the Focus (the selected Structure, or the Condition's Structures) | `--oxblood`, opaque, even cortex under X-ray | yes | yes |
| 2 | Isolate is on | `--porcelain-ghost` | no | no |
| 3 | X-ray is on and it's cortex (the eight cortical Structures, ADR 0002) | frosted | no | no, so clicks reach deep Structures; cortex stays reachable through the Structure index |
| 4 | Otherwise | `--porcelain` | yes | yes |

White matter (ADR 0002's context mesh) is never pickable. It's shown and capped only during Slice, and hidden whenever X-ray or Isolate is on, so its caps don't bury the deep sections. The Slice plane clips everything; the table only decides who gets caps.

**Slice under Split.** The plane is in anatomical coordinates: each hemisphere is clipped by the plane carried along with it, so "Sagittal · x = −22 mm" always means that anatomical position. The `--oxblood` frame is drawn once per hemisphere it actually crosses.

## Camera

The model holds only a camera **intent** and a `seq` counter that increments on every requested move; the renderer owns the actual pose and the Visitor's orbit. Moves happen only when:

- a Focus is set: `frame` its Structure-sides where they currently sit (after Split, if on), so both halves stay in view;
- Split turns on: `medial`;
- Reset: `home`.

Clearing the Focus, turning Split off, X-ray, Slice and Isolate never move the camera. When two requests happen, the latest wins. Reduced motion turns every move into a cut.

## URL, deep links and history

- **Format:** `?condition=<id>#brain-explorer` and `?structure=<id>#brain-explorer`. Without JS the browser just jumps to the section. With JS, clicks are intercepted: smooth scroll (instant under reduced motion), dispatch, history update.
- **Condition chips** in the Structure panel link to `#condition-<id>`, the `id` on each Conditions row. The Explorer keeps its state while the Visitor is away.
- **History:** `pushState` only on cross-section jumps ("See it in the brain →" and Condition chips), so Back returns to where the Visitor came from and restores the previous Focus. Selections inside the Explorer use `replaceState`, so the URL is always shareable without filling the history. Tool state never enters the URL.
- **On load,** the URL is applied to the store right away, before the GLB finishes loading. An unknown id is ignored and removed from the URL; if both params are present, `condition` wins. The Visitor never sees an error.

## Consequences

- The reducer, `deriveView` and the URL parse/serialize functions are the test surface. The scene has no rules of its own.
- The Condition ↔ Structure map (DESIGN.md §9) and the cortex/deep split (ADR 0002) are inputs to `deriveView`. The cortex/deep split lives in `lib/brain/` next to the node mapping. The map lives in `content/conditions.ts`, as each Condition's `structures` (amended by ADR 0004).
- Mobile gesture capture ("Tap to explore" / Exit) and the bottom sheet are not decided here; they read the same store.
