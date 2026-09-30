# Brain-derived art (#35)

`bun run build:brain-art` reads the committed `public/models/brain.glb` with its Draco decoder and writes two SVG derivatives. The specimen outline traces a depth projection's silhouette and visible anatomical boundaries, including the central and lateral sulci. Its desktop and portrait home-camera projections share one SVG, fitted to the stage using generated framing metadata. The coronal section intersects the Structure triangles at z = 0 mm and joins their contours. Its single callout is anchored on the Thalamus contour.

The specimen SVG is 25,799 bytes; the coronal SVG is 24,821 bytes. Both use a `0 0 1000 1000` viewBox, 1px ink-soft strokes and non-scaling strokes. Rebuilding produces identical SHA-256 hashes. The SVG metadata and `public/models/CREDITS.md` retain the source model's attribution and CC BY-SA 4.0 license.

The loading placeholder and no-WebGL fallback share the specimen outline. The first rendered frame starts a 400ms cross-fade (`--dur-base`); reduced motion makes the handoff immediate. Idle rotation starts after readiness, keeping the first frame in the home view. First visit places the decorative, aria-hidden section art in desktop columns 8–12 and below the steps on mobile. All art uses native lazy loading and explicit dimensions.

## Screenshots

Captured against the production build in Chromium, with reduced motion to hold the home view still. The GLB request was held for the loading captures, then released for the ready captures. Section-only First visit captures use JavaScript disabled and hide the sticky header to avoid its overlay in the tall screenshot.

| View | Loading outline | First rendered specimen | First visit |
| --- | --- | --- | --- |
| Desktop, 1440 × 1000 | [Loading](./loading-desktop.png) | [Ready](./ready-desktop.png) | [Section art](./first-visit-desktop.png) |
| Mobile, 375 × 812 | [Loading](./loading-mobile.png) | [Ready](./ready-mobile.png) | [Section art](./first-visit-mobile.png) |

## Validation

- `bun run check`: clean types and lint, 130 unit tests passing, production build passing.
- Full Chromium suite: 62 tests passing, including axe, no-JavaScript content, no-WebGL exploration and keyboard interaction.
- After enabling native lazy loading on the outline, all 21 Explorer, no-WebGL and First visit specs pass again against the final production build.
- Bundle budgets: initial route 168.9 KB / 170 KB; 3D chunk 361.0 KB / 400 KB, gzipped. The committed GLB remains unchanged.
- Keyboard coverage: Structure index selection with Enter, Home/End, leaving the index with Tab, Escape to clear Focus, tool toggles, and navigation focus restoration. Decorative art adds no Tab stops.

Local Lighthouse uses Playwright-managed Chromium on debug port 9222 (the existing Windows CLI workaround). A separate checkout of the original commit, `7dbef63`, supplies the baseline. Three-run medians are below. Run-to-run variation is substantial; these samples show no LCP regression but do not establish a performance improvement.

| Metric | Original commit | This change | Gate |
| --- | --- | --- | --- |
| LCP | 3.55 s | 2.79 s | Compared for regression |
| Performance | 77 | 82 | ≥ 90 |
| Total blocking time | 520 ms | 600 ms | ≤ 200 ms |
| Layout shift | 0 | 0 | ≤ 0.1 |

The local Lighthouse performance and blocking-time gates fail for both versions. Required remote CI statuses remain pending. See the filled [PR description](./PR.md).

The 3D rendering pipeline is unchanged; this slice changes SVG art, CSS opacity transitions and the start of idle rotation. Hardware fps measurement was not performed.
