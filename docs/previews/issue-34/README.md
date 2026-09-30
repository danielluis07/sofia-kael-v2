# Mobile navigation (#34)

The mobile header now opens a full-screen shadcn Sheet backed by Base UI Dialog. The local `full` side uses the paper background, serif section links and the consultation pill. Links wait for the close transition to finish before changing the hash and moving keyboard focus to the destination headline.

- [Header with Menu](./mobile-nav-closed.png)
- [Full-screen navigation](./mobile-nav-open.png)

Captured at 375 × 812 with reduced motion in Chromium against a production build.

Keyboard coverage in `e2e/mobile-nav.spec.ts`: Enter opens Menu, Tab and Shift+Tab wrap inside the sheet, Escape and Close return keyboard focus to Menu, and Enter on every section link and the consultation pill closes the sheet and moves keyboard focus to the headline. The global oxblood outline remains in use. The spec also covers desktop resizing, axe with the sheet open, reduced motion, and footer navigation without JavaScript.

Validation: `bun run check` passes (115 unit tests), all 57 Playwright tests pass, and bundle budgets pass (168.9 KB initial JavaScript; 360.6 KB 3D chunk, gzipped). The Sheet runtime loads on the first Menu opening to keep the initial route within budget.

Local Lighthouse remains below ADR 0006's performance gates: the isolated three-run check reported a median performance score of 82 (minimum 90), median TBT of 361 ms (maximum 200 ms), and CLS of 0. The default CLI hit a Windows temporary-profile cleanup error, so the completed run used Playwright-managed Chromium on debug port 9222 with `bun run lhci --collect.settings.port=9222`. Remote CI has not been run. These pending gates are recorded in the [draft PR description](./PR.md).

The Brain Explorer rendering is unchanged; no fps measurement is required.
