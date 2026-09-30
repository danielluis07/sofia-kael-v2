# Slice (#29)

The rail's Slice button (`aria-pressed`) opens a segmented control (Sagittal / Coronal / Axial, native radios) and a slider across the brain's bounds on that axis, in whole millimetres. The mono readout, e.g. "Coronal · y = −12 mm", is in anatomical RAS convention, and the slider announces the same text as its `aria-valuetext`. Changing the axis re-centres the plane at 0 mm. Toggled off and on, Slice keeps its axis and position; Reset brings back Coronal 0 mm.

Every Structure-side is clipped by its hemisphere's copy of the plane, so under Split the plane stays anatomical. Each part the plane crosses gets a stencil cap: `--porcelain-cut` for the cortical ribbon, a lighter tone for the white matter inside it, and `--oxblood-deep` for the Focus. Ghosts and frosted cortex get no caps, and the white matter hides under X-ray and Isolate. three-mesh-bvh contours outline each cut; `SLICE_CONTOURS` in `explorer-stage.tsx` is the flag the mobile fallback ladder can turn off. The hairline `--oxblood` frame is drawn once per hemisphere the plane crosses.

- [Coronal, y = −12 mm](./slice-coronal.jpg)
- [Sagittal, x = −30 mm: the left hemisphere cut](./slice-sagittal.jpg)
- [Axial, z = 20 mm, orbited to look down](./slice-axial.jpg)
- [Coronal under Split: one frame per hemisphere](./slice-split.jpg)
- [X-ray and a Focus: deep Structures capped, the Thalamus in `--oxblood-deep`](./slice-focus-xray.jpg)
- [A narrow window: the controls wrap and the rail scrolls sideways](./slice-narrow.jpg)

Captured in Chrome against the dev server (1522 × 632 viewport; the narrow one at 502 px, Chrome's minimum window width).

## fps

AMD Radeon Vega 10 (integrated laptop GPU), 1885 × 650 canvas at DPR 1.25, production build. 60 fps is the vsync cap. This machine's baseline drifted between runs (Slice off read anywhere from 49 to 60 in one noisy session), so the rows below come from one calm session, each next to its own baseline.

| Config | fps |
|---|--:|
| Slice off, home view | 60 |
| Slice, home view | 60 |
| First Slice toggle after load | no stall; worst frame 50–66 ms |
| Scrubbing the slider, 1 mm every frame | 49–52 |
| Focus framed (Thalamus), Slice off / on | 60 / 55–58 |
| Slice + Split | 50 |
| Slice + Split + X-ray | 59 |
| Every tool on (Slice, Split, X-ray, Isolate, Focus) | 56 |
| Same, with Slice off | 56 |

With every tool on, Slice costs nothing measurable: Isolate leaves only the Focus capped, and the frost is the limit, as in #28. The cost of Slice alone is fill rate in the stencil passes, and it grows as the camera comes closer. Hiding the passes and caps brings it back to 60, while the contours cost almost nothing. Rebuilding the contours takes about 3 ms per step in dev.

Not measured on a phone.
