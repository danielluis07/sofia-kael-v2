## What and why

Closes #35.

Replace the temporary brain drawing with committed art generated from the curated GLB. The loading placeholder and no-WebGL fallback use desktop and portrait home-camera outlines; when the first frame is ready, the outline cross-fades to the canvas over `--dur-base`. First visit gains an aria-hidden coronal section in columns 8–12, with one Thalamus callout. The build command, artifact tests and CC BY-SA attribution are included.

## Checklist (ADR 0006)

- [x] `bun run check` passes (130 unit tests; clean types, lint and production build)
- [x] e2e specs cover the new behaviour (62 passing; 21 relevant specs repeated after native lazy loading)
- [x] axe is clean (no new rule disables)
- [x] Keyboard-only walk-through via Chromium automation: Structure index, Enter, Home/End, Tab, tools, Escape and navigation focus restoration; global oxblood focus ring retained
- [x] Screenshots included below
- [ ] Hardware fps recorded (not measured; SVG/CSS handoff changes, with the 3D rendering pipeline unchanged)

Bundle budgets pass: initial route 168.9 KB / 170 KB; 3D chunk 361.0 KB / 400 KB, gzipped. Model bytes are unchanged. The SVGs are 25,799 and 24,821 bytes and rebuild deterministically.

Local Lighthouse remains below the performance and blocking-time gates: three-run medians are 82 and 600ms. The original commit also fails, at 77 and 520ms. LCP is 2.79s versus the baseline's 3.55s; CLS is zero in both. Measurements vary substantially between runs. Required remote CI statuses are pending; ADR 0006's full release gate is not yet satisfied.

## Screenshots / preview link

- Desktop handoff: [loading outline](./loading-desktop.png), [ready specimen](./ready-desktop.png)
- Mobile handoff: [loading outline](./loading-mobile.png), [ready specimen](./ready-mobile.png)
- First visit: [desktop](./first-visit-desktop.png), [mobile](./first-visit-mobile.png)
- [Implementation and validation notes](./README.md)

## fps (if rendering changed)

Hardware fps was not measured. No changes to the 3D renderer, materials, lighting, camera framing or effects; idle rotation is held until the first-frame readiness signal.
