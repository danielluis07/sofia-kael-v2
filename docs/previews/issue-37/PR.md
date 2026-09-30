## What and why

Closes #37.

The Conditions section now explains what Dr. Kael treats and how to reach the related Structures in the Brain Explorer. All seven remaining placeholders are replaced, the placeholder helper is removed, and content integrity tests require zero placeholder calls or filler text. The copy pass also gives About a direct headline, explains the neurological examination in plain words, and simplifies the credentials headline and Contact introduction.

Training dates, publication titles and years are preserved. Fictional credential names are replaced after checking for existing healthcare uses. The footer disclaimer and model attribution remain verbatim.

## Fictional name checks

Checked on September 30, 2026. Exact full-name searches and searches for the distinctive roots Talvenwick, Orseldane and Veylford returned no matching institutions or journals. Search results cannot prove that a name is unused; these checks support the human review.

| Name | One-line check |
| --- | --- |
| Talvenwick School of Medicine | Invented school; no matching result for the full name or the root Talvenwick. |
| Orseldane Teaching Hospital | Invented hospital; no matching result for the full name or the root Orseldane. |
| Veylford Institute for Neurological Studies | Invented research institute; no matching result for the full name or the root Veylford. |
| Talvenwick Journal of Clinical Neurology | Invented journal; no matching result for the full name or the root Talvenwick. |
| Veylford Review of Neurological Practice | Invented journal; no matching result for the full name or the root Veylford. |
| Kael Neurology | Established fictional practice name; the search returned unrelated uses of Kael, with no matching practice identified. |

The draft names were changed because searches surfaced [Aldermere in a healthcare marketing case](https://www.saydigital.marketing/cases/aldermere), [Bellwick Place in a North Carolina healthcare record](https://info.ncdhhs.gov/dhsr/mhlcs/sods/2024/20240625-070585.pdf?ver=1), and [Northmere hospitals in a separate fictional roleplay project](https://uhon-nhs.org/). The new names avoid those overlaps. The fictional Boston address remains 24 Aldermere Lane; the address search did not identify a matching Boston street.

## Human copy review

Review all copy in [site.ts](../../../content/site.ts), [conditions.ts](../../../content/conditions.ts), [structures.ts](../../../content/structures.ts), and the alt text in [portraits.ts](../../../content/portraits.ts). The Structure and Condition descriptions were read during this pass and retained: their symptom lists carry distinct information, and their qualifiers describe real uncertainty. No medical claims were added to those descriptions.

- [ ] Human has reviewed all site copy and fictional names.
- [ ] Human has reviewed the medical explanations for plausibility, including the emergency-care sentence for Stroke and the distinction between Ventricles and surrounding tissue in Multiple sclerosis.
- [ ] Third person for Dr. Kael and second person for the Visitor, plain words, medical terms explained, no testimonials, no promises of cures or outcomes.

## Checklist (ADR 0006)

- [x] `bun run check` passes: types, lint, 139 unit tests and production build.
- [x] Existing e2e specs cover the affected sections and flows: 67 pass. No interaction changes require new specs.
- [x] axe is clean in the existing desktop, mobile, Structure and Condition checks; no new disables.
- [x] Keyboard-only walk-through in Chromium automation: Tab and Enter through all five desktop navigation links, with a visible 2px oxblood focus ring. The e2e suite also passes mobile focus trapping, Escape and focus restoration, Structure index navigation and tool keyboard controls.
- [x] Screenshots included below.
- [x] fps is not applicable: copy and content tests only; the rendering code is unchanged.
- [ ] Required remote CI statuses are green. These local changes have not been published as a PR.

Bundle budgets pass: initial-route JavaScript 168.9 KB gzipped (170 KB limit), 3D chunk 361.4 KB (400 KB limit).

Local Lighthouse completed three production runs using Playwright Chromium attached on port 9223. The median performance score is 84 (required 90) and median total blocking time is 296.5 ms (limit 200 ms), so Lighthouse is not green. Previous review notes for #32 and #35 also record local failures; no baseline comparison was run for this copy pass. The full ADR 0006 release gate remains unmet.

## Screenshots / preview link

Production build, 1440px desktop and 375px mobile, reduced motion, JavaScript disabled. The sticky header is hidden only for section screenshots so it does not cover the copy. Both widths were checked for horizontal overflow.

| Section | Desktop | Mobile |
| --- | --- | --- |
| About | [Desktop](./about-desktop.png) | [Mobile](./about-mobile.png) |
| Conditions | [Desktop](./conditions-desktop.png) | [Mobile](./conditions-mobile.png) |
| Credentials | [Desktop](./credentials-desktop.png) | [Mobile](./credentials-mobile.png) |

## fps (if rendering changed)

Not applicable.
