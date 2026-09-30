# Split (#28)

The rail's Split button (`aria-pressed`) slides the `.l` and `.r` halves apart along X, 45 mm each off the midline, over `--dur-camera`, and back again. It's a cut under reduced motion. Turning Split on requests the `medial` camera: the camera turns 42° off straight ahead toward the side it was on, and 8° up. It looks through the gap at the far half's medial surface, which shows the cut corpus callosum, thalamus, brainstem and vermis, and it aims halfway between that half's centre and the midline so the near half stays in view. Turning Split off never moves the camera. A Focus set while split frames its Structure-sides where the halves settle, even mid-slide. The contact shadow follows the slide and bakes again once the halves settle.

- [Split on: the medial view](./split-medial.jpg)
- [A Focus while split frames both halves of the Corpus callosum](./split-focus.jpg)
- [Split + X-ray + a Focus](./split-xray-focus.jpg)
- [Split off: the halves close and the camera stays](./split-off.jpg)

Captured in Chrome against the dev server (1522 × 632 viewport).

## fps

AMD Radeon Vega 10 (integrated laptop GPU), 1884 × 699 canvas at DPR 1.25, production build. 60 fps is the vsync cap.

| Config | fps |
|---|--:|
| Structure focused, whole | 59–60 |
| Structure focused, split | 59–60 |
| During the 900 ms slide apart | 60 |
| Split + X-ray | 51 |
| Split + X-ray + Isolate | 45–50 |
| X-ray + Isolate, whole (same session, for comparison) | 45–49 |

Split costs nothing measurable. Every drop in this session comes from X-ray's frost, and it's the same with the brain whole. #27 recorded 60 for X-ray + Isolate, so this session's GPU was running slower, or #27's number was optimistic. The frost's overdraw may be worth a look when Slice brings its own cost.

Not measured on a phone.
