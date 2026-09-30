# Hero portrait

Generated with the built-in GPT image generation tool, using the workspace's `sofia-kael.png` as the identity reference for the fictional Dr. Sofia Kael. The original reference stays untouched. The tool does not expose a selectable model version.

Final asset: `content/portraits/sofia-hero.png`, with a transparent alpha background. The separate seated About portrait is documented in `docs/about-portrait.md`.

## Verification

- The generated PNG is 1122 × 1402 with a real alpha channel, including fully transparent pixels.
- `bun run check`: passes, including 48 unit tests and the production build.
- `bun run e2e`: all 16 checks pass, including axe, no JavaScript, reduced motion, mobile overflow and Explorer loading. The phone loading check now scrolls relative to the stage rather than assuming the height of preceding sections.
- `bun run budget`: passes (154.1 KB initial-route JavaScript; 359.6 KB for the 3D chunk, gzipped).
- Desktop (1440px) and mobile (375px) screenshots were reviewed.
- The final local three-run Lighthouse measurement fails performance and TBT gates: median performance 84, TBT 389 ms, CLS 0 and LCP 3.50 s. The LCP range is 2.44–3.58 s, so #31's 2.5-second target is not verified. Hero rendering is immediate and its image is eager with high fetch priority.

## Generation prompt

```text
Use case: photorealistic-natural
Asset type: transparent portrait cutout for the Kael Neurology website hero, portrait 4:5 composition.
Input image: identity reference only, a fictional character named Dr. Sofia Kael. Preserve her recognizable face, hazel eyes, fair skin, age, and long naturally wavy copper red hair from the reference.
Primary request: create a new editorial photograph of this same woman standing in a relaxed three-quarter pose, shoulders slightly angled toward the viewer's left, looking directly at the camera with a calm subtle smile. Both hands loosely clasped naturally at waist level, all fingers anatomically plausible. Frame from above the head to mid-thigh with comfortable margins around hair, elbows and hands; subject occupies most of the portrait.
Wardrobe: understated muted warm taupe tailored blazer over an ivory blouse, small gold earrings and a delicate gold necklace, professional everyday clothing.
Lighting: soft natural window light, realistic skin texture, slightly desaturated warm color grade suited to warm off-white paper.
Background: actual fully transparent alpha background, clean detailed hair edges. No room, desk, chair, signage, props, drop shadow, checkerboard or colored backdrop. No white medical coat, stethoscope, text, logos or watermark. Preserve reference identity; create the new standing pose.
```
