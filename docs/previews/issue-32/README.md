## What and why

Closes #32.

First visit now presents four numbered steps in second person, with the content confined to desktop columns 1–7 and columns 8–12 reserved for future brain-derived art. Credentials now pairs a training and affiliations timeline with selected publications. Years use monospace tabular numerals; one decorative leader-line callout sits beside the desktop timeline and is hidden from assistive technology.

Section copy lives in `content/site.ts`. Institutions and journals are fictional and remain `placeholder()`-wrapped for the final copy review. The placeholder integrity test now accepts nonempty fictional names as ADR 0004 requires.

## Checklist (ADR 0006)

- [x] `bun run check` passes: types, lint, 79 unit tests, production build.
- [x] e2e specs cover the new behaviour: the only ordered sequence, content without JavaScript, desktop columns, mobile stacking and overflow.
- [x] axe is clean: desktop and mobile, with no rule disables; all 30 Playwright tests pass.
- [x] Keyboard-only walk-through done in Chromium through Playwright: desktop First visit anchor via Tab and Enter, visible 2px oxblood focus ring, continued Tab order into the footer, and mobile footer navigation. Static content adds no Tab stops or Escape behavior; the existing Explorer Esc test passes.
- [x] Screenshots are included below.
- [x] fps is not applicable: these are static Server Components with no changes to the Brain Explorer rendering.

Bundle budgets pass: initial-route JavaScript 161.8 KB gzipped; 3D chunk 361.0 KB gzipped.

Lighthouse is **not green locally**: the three-run median is Performance 83 (required ≥90), TBT 604 ms (required ≤200 ms), and CLS 0 (required ≤0.1). The first standard `bun run lhci` attempt failed during Windows Chrome temporary-profile cleanup (`EPERM`). A retry attached Lighthouse to an existing Playwright-launched Chromium on port 9222 and completed all three runs with the original thresholds. Lighthouse also reported that this machine's CPU was slower than expected. No performance settings or budgets were changed.

Remote CI statuses require a published branch/PR and have not been checked for these local changes.

## Screenshots / preview link

Captured against the production build, with reduced motion enabled. The sticky header is hidden only during the section captures to keep the content unobscured.

| Section | Desktop, 1440px | Mobile, 375px |
| --- | --- | --- |
| First visit | [Desktop](./first-visit-desktop.png) | [Mobile](./first-visit-mobile.png) |
| Credentials | [Desktop](./credentials-desktop.png) | [Mobile](./credentials-mobile.png) |

## fps (if rendering changed)

Not applicable.
