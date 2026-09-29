# Quality bar

Every build slice meets one bar, and each ticket's acceptance criteria point to it: "Definition of done: ADR 0006", followed by the slice's own criteria (the reducer rules it unit-tests, the flows it adds to e2e, and the DESIGN.md §9 accessibility items it covers). The machine-checkable parts run in GitHub Actions as required statuses on every PR. The parts that need a human (how it looks, frame rate, screen readers) go in the PR description, driven by a PR template.

## Considered Options

- **DOM component tests** (happy-dom + Testing Library) for the tool rail, panel and Structure index. Rejected: the rules already live in the pure reducer (ADR 0003), and the DOM wiring gets tested once, end to end, rather than twice.
- **Screenshot diffs** (`toHaveScreenshot`). Rejected: WebGL output differs between GPUs and SwiftShader, so brain diffs would be flaky and would get ignored. A human reviews every UI PR anyway.
- **Relying on Vercel's preview build** as the only gate. Rejected: it catches build errors but not lint, types, tests or budgets.
- **Playwright on Chromium, Firefox and WebKit in CI.** Rejected for cost. The other engines get a manual check at milestones.
- **Blocking on fps in CI.** Rejected: headless GPU numbers mean nothing. Fps is measured by hand and recorded.

## Gates

`bun run check` runs `tsc --noEmit`, then `eslint`, then `bun test`, then `next build`. Agents run it before opening a PR, and CI runs the same script. GitHub Actions also runs, as required statuses:

- **Playwright e2e** against `next build && next start`, Chromium only, with axe inside (see Accessibility).
- **Bundle budgets:** a small bun script reads the `.next` build output and fails over budget (see Performance).
- **Lighthouse CI** on the home page (the site is a single page).

## Tests

- **Unit (`bun test`)** stays on pure logic, with no DOM:
  - `explorerReducer`, `deriveView` and the URL parse/serialize functions (ADR 0003);
  - content integrity (ADR 0004);
  - the curated GLB's output (ADR 0002): one mesh per Structure-side with the expected names and extras, no mesh in two Structures, and file size within budget.

  Test files sit next to their module as `*.test.ts`.
- **End to end (Playwright, `e2e/`)** is a small suite covering the critical flows:
  - deep links: `?structure=`, `?condition=`, and an unknown id being dropped from the URL;
  - keyboard selection through the Structure index;
  - tool toggles and `aria-pressed`;
  - Esc, Clear and Reset;
  - "See it in the brain →" and Condition chips, with Back restoring the previous Focus;
  - content visible with JavaScript disabled;
  - "Tap to explore" and Exit at a mobile viewport;
  - the no-WebGL fallback.

  Assertions target the DOM, the URL and the store, never pixels. Only one smoke spec waits for the GLB, because SwiftShader is slow. Each UI slice adds the specs for the behaviour it introduces.
- **Visual:** no automated diffs. Every UI PR includes screenshots or the Vercel preview link, and the human checks it against DESIGN.md.

## Accessibility

- **Target: WCAG 2.2 AA.** DESIGN.md §9's Explorer items become explicit acceptance criteria wherever a slice touches them: every Structure reachable by keyboard through the Structure index, tools as real labelled buttons with `aria-pressed`, a text description of the canvas, a Structure panel announced politely, and reduced motion respected.
- **axe** (`@axe-core/playwright`) runs on these states: page load, a Structure focused, a Condition focus, and the mobile sheet expanded. Any violation fails. An exception needs a rule-scoped disable with a written reason next to it.
- **Reduced motion** has one spec under `reducedMotion: 'reduce'`. It checks that the reveals are off and that camera moves are cuts (the store's camera intent plus a zero-duration flag).
- **Manual:** every UI PR states that a keyboard-only walk-through was done: Tab order, the visible `--oxblood` focus ring, and Esc. Screen-reader spot checks (VoiceOver and NVDA) happen once, at the Explorer milestone.

## Performance

**Blocking in CI** (LCP is deliberately not a gate: it is noisy on CI runners and does not matter for this site):

| Budget | Limit | Checked by |
|---|---|---|
| CLS | ≤ 0.1 | Lighthouse CI, mobile preset, median of 3 runs, production build |
| TBT | ≤ 200 ms | same |
| Lighthouse Performance | ≥ 90 | same |
| Initial-route JS (excluding the 3D chunk) | ≤ 170 KB gzipped | bundle script |
| 3D chunk (three, R3F, drei, Explorer) | ≤ 400 KB gzipped, loaded only near or in the Explorer section | bundle script |
| Curated GLB (Draco) | ≤ 3 MB, never blocking LCP, with byte progress (#2) | `bun test` |

**Measured, not blocking:** frame rate. Slices that change rendering cost (first Explorer render, Slice, X-ray, Split, mobile) record fps in the PR, using the #6 prototype's benchmark approach.

- **Desktop:** an integrated laptop GPU holds 60 fps with every tool on.
- **Phone:** a mid-range phone (Pixel 6a or iPhone 12 class) holds ≥ 30 fps while orbiting with Slice on, with DPR capped at 2. This number is provisional. A `ready-for-human` ticket, which blocks the mobile Explorer slice, runs the prototype's one-tap benchmark on a real phone. If it falls short, these fallbacks apply in order until it passes:
  1. Cap DPR at 1.5.
  2. Turn N8AO off on mobile.
  3. Share one stencil pass and cap across non-nesting Structures.
  4. Turn the Slice contours off.

## Browser support

- The last two versions of Chrome, Edge, Firefox and Safari, plus iOS Safari 17+ and Android Chrome. CI runs only Chromium; Firefox and WebKit are checked by hand at milestones.
- **Without WebGL2**, or if the GLB fails to load, the stage shows the loading line drawing, the canvas text description, and a working Structure index and Structure panel (text only, no scene). Deep links still open the right panel. The Visitor never sees an error.

## Consequences

- The **first build slice** sets up the tooling before any feature lands:
  - the `check` script;
  - the GitHub Actions workflow;
  - Playwright with axe;
  - Lighthouse CI;
  - the bundle budget script;
  - `.github/pull_request_template.md`;
  - a smoke spec against the placeholder page.
- **The PR template** carries the checklist:
  - `check` passes;
  - e2e specs cover new behaviour;
  - axe is clean;
  - a keyboard walk-through was done;
  - screenshots or a preview link are included;
  - fps is recorded if rendering changed.
- **The no-WebGL fallback is a feature:** the Structure index and panel must work without the scene, which keeps them decoupled from the canvas (consistent with ADR 0003).
- **Changing a budget means amending this ADR.** It is never done silently in a config file.
