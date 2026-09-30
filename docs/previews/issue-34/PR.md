## What and why

Closes #34.

Mobile Visitors can open a full-screen navigation sheet with the five section links and a consultation pill. The sheet uses shadcn over Base UI Dialog, adapted to the paper background and serif typography. Choosing a link closes the sheet before changing the hash and moves keyboard focus to the section headline. Escape and Close return keyboard focus to Menu. Footer links remain available without JavaScript.

The modal runtime loads on first opening to keep initial-route JavaScript below the 170 KB budget. ADR 0005 records the shadcn amendment and loading strategy.

## Checklist (ADR 0006)

- [x] `bun run check` passes (115 unit tests)
- [x] e2e specs cover the new behaviour (57 tests pass)
- [x] axe is clean, including the open mobile sheet
- [x] Keyboard-only flow verified through Playwright: Tab, Shift+Tab, Enter and Escape
- [x] Screenshots included below
- [x] Bundle budgets pass: 168.9 KB initial-route JS; 360.6 KB 3D chunk, gzipped
- [ ] Human keyboard and visual review
- [ ] Lighthouse performance gates
- [ ] Required remote CI statuses

Local Lighthouse (three runs, after e2e finished): median Performance 82, TBT 361 ms, CLS 0. Performance and TBT fail the configured 90 / 200 ms gates. On Windows, the run used Playwright-managed Chromium with `bun run lhci --collect.settings.port=9222` to avoid ChromeLauncher's temporary-profile cleanup error.

## Screenshots / preview link

- [Mobile header](./mobile-nav-closed.png)
- [Open navigation sheet](./mobile-nav-open.png)

## fps (if rendering changed)

Brain Explorer rendering is unchanged; no fps measurement is required.
