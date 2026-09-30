# X-ray (#27)

The rail's X-ray button (`aria-pressed`) cross-fades the eight cortical Structures to frosted porcelain over `--dur-slow`, with a cut under reduced motion. Deep Structures stay opaque, and a focused Structure stays opaque oxblood, cortex included. The frost uses the fresnel curve approved on #6, alpha 0.025 + 0.35·rim³, so overlapping gyri stay clear instead of going cloudy. Frosted cortex isn't pickable, so canvas clicks reach the deep Structures behind it. The Structure index still selects cortex.

- [X-ray on, no Focus](./xray-desktop.jpg)
- [A click through the frost selects the Corpus callosum](./xray-click-through.jpg)

Captured in Chrome against a production build (1522 × 632 viewport).

## fps

AMD Radeon Vega 10 (integrated laptop GPU), 1884 × 699 canvas at DPR 1.25, production build. 60 fps is the vsync cap.

| Config | fps |
|---|--:|
| X-ray off, Structure focused | 60 |
| X-ray on, Structure focused | 59 |
| X-ray + Isolate | 60 |
| During the 700 ms cross-fade | 60 |

Not measured on a phone.
