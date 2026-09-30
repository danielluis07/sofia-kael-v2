# How the non-3D sections are built

`app/page.tsx` is a Server Component that renders the sections in page order, each one a Server Component in `components/sections/`. Outside the Brain Explorer there are only two client islands: the mobile nav sheet and the contact form. Everything else is server-rendered HTML that works without JS:

- **Reveal:** one inline script with an IntersectionObserver drives a time-based CSS transition, and nothing is hidden unless that script runs.
- **Nav hairline:** a CSS scroll-driven animation.
- **Portraits:** empty `--paper-2` frames until the AI portraits exist; later, local files, statically imported.
- **Contact form:** shadcn fields on top of native constraint validation (amended for #33).

Amended on 2026-09-30 for #33 at the user's request: Contact uses shadcn's `Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `FieldSet`, `FieldLegend`, `Input` and `Textarea`, alongside the existing `Button`. These local components are adapted to DESIGN.md. A native form reads constraint validity on submit, associates errors with controls and manages focus. The shadcn `Input` renders a native input rather than loading Base UI's Field runtime. This avoids adding a form library and keeps the initial JavaScript within ADR 0006's budget.

## Considered Options

- **CSS scroll-driven animations for the reveal** (`animation-timeline: view()`). They need no JS, but the fade is scrubbed by scroll position instead of played once. An element resting near the bottom of the viewport stays half-faded, which breaks DESIGN.md §7's "fully visible at rest", and scrolling back reverses it. Support is also uneven (Firefox).
- **A client `<Reveal>` with IntersectionObserver in `useEffect`.** It's hydration-safe, but content in view stays hidden until hydration finishes, and every revealed block becomes a client boundary.
- **Motion (framer-motion) for the reveal.** A large dependency for one fade.
- **Unsplash placeholder portraits.** Real faces help judge the look, but a stranger's photo would be presented as the fictional Dr. Kael, so the site couldn't be shared until the AI portraits landed, and those are out of scope for this build. (Amended on 2026-09-29, when the build was sliced; this ADR first chose local Unsplash files.)
- **`remotePatterns` for Unsplash.** The page would depend on images.unsplash.com at runtime (plus its redirects and the optimizer allowlist). Swapping in the AI portraits would also mean editing config as well as content.
- **react-hook-form + zod.** Two dependencies for five fields whose data goes nowhere.
- **Only the browser's native validation bubbles.** They can't be styled to DESIGN.md §10 (oxblood text and an icon below the field).
- **Unmodified shadcn `Sheet`.** Its default side-panel layout does not fit full-screen navigation. Amended on 2026-09-30 for #34 at the user's request: use the local shadcn `Sheet` over Base UI `Dialog`, with a `full` side for the full-screen paper popup, no shadows, and a text close control. The original decision also excluded shadcn form controls; #33 now uses them with bottom-border styling at the user's request.

## Page composition

- `app/page.tsx` renders `<SiteNav />`, then `<main>` with Hero, About, Conditions, Brain Explorer, First visit, Credentials and Contact, then `<SiteFooter />`. The current placeholder is replaced.
- A server `Section` component draws the shared opening from DESIGN.md §4: the `--ink` rule, the eyebrow and the `display-l` headline. It takes the `id` and label from ADR 0004's `SECTIONS` where the section has one (Hero and Credentials don't), and sets `aria-labelledby` on the headline.
- **Anchors:** sections get `scroll-margin-top: var(--nav-h)` so an anchor jump never lands under the sticky nav, and `html` gets `scroll-behavior: smooth` (the existing reduced-motion rule already turns it off).
- **"See it in the brain →"** and the Condition chips are plain `<a href>`s in server markup (`?condition=<id>#brain-explorer`, `#condition-<id>`). The interception ADR 0003 describes is a single delegated click listener installed by the Explorer's client code, so the Conditions section stays a Server Component.
- **Brain Explorer:** only its island is client code. Its section shell (eyebrow, headline, loading placeholder) is server-rendered.

## Reveal

- **Markup:** a server `<Reveal>` component renders its element with `data-reveal`, an optional `--reveal-i` stagger index, and `suppressHydrationWarning`. Only markup present at first load is marked; client-rendered content (e.g. the form's success panel) doesn't reveal.
- **Script:** a small inline `<script>` at the end of `<body>`, rendered from the root layout, not a client component, so it doesn't wait for hydration. It runs only when `IntersectionObserver` exists and `prefers-reduced-motion` isn't `reduce`, and then it:
  - adds `reveal` to `<html>` (which carries `suppressHydrationWarning`);
  - observes every `[data-reveal]`;
  - on first intersection, sets `data-revealed` on the element and unobserves it. Each element reveals once.
- **CSS:**

  ```css
  .reveal [data-reveal]:not([data-revealed]) { opacity: 0; transform: translateY(12px); }
  [data-reveal] {
    transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
    transition-delay: calc(min(var(--reveal-i, 0), 5) * 60ms);
  }
  @media print { .reveal [data-reveal] { opacity: 1; transform: none; } }
  ```

- **Without the script** (no JS, reduced motion, script error), nothing is ever hidden.
- **The hero** uses the same mechanism. The observer fires on the first frame, so it plays as the entrance, and the `rise-in` keyframe's one-off use in the placeholder goes away.

## Navigation

- **`SiteNav`** is a Server Component: the wordmark, the `SECTIONS` links and the "Book a consultation" pill (a `#contact` link styled with `buttonVariants`). It is `sticky top-0` on `--paper`, and its height is published as `--nav-h`.
- **The hairline** is pure CSS. The border is `--rule` by default, and under `@supports (animation-timeline: scroll())` a scroll-driven animation fades it in over the first 16px of scroll. Where scroll-driven animations aren't supported, the hairline is simply always on. The global reduced-motion override (`animation-duration: 0.01ms !important`) must not apply to it: the hairline is a state, not motion.
- **The mobile sheet** is the only client part of the nav: `MobileNavSheet`, a shadcn `Sheet` backed by Base UI `Dialog`, shown below `md`. A text "Menu" button opens a full-screen `--paper` popup with the `SECTIONS` links in the serif at `display-m` and the consultation pill. Base UI provides the focus trap, scroll lock, Esc and focus return.
- **A link in the sheet** closes the dialog first. Once the close completes (`onOpenChangeComplete`), the code sets the hash, so the scroll lock is released before the jump, and moves keyboard focus to the target section's headline.
- **Without JS**, the Menu button does nothing. Mobile Visitors navigate with the footer's anchor links (DESIGN.md §8), which are always present.
- **Loading:** the shadcn Menu button is server-rendered. Its client wrapper loads the Sheet runtime on the first opening with `next/dynamic`; the closed dialog stays mounted afterward so Base UI can finish transitions and return keyboard focus. This keeps initial-route JavaScript within ADR 0006's 170 KB budget.

## Portraits

Amended on 2026-09-30 for #31: both sections now use AI-generated portraits of the fictional Dr. Kael, guided by the supplied identity reference. At the user's request the hero has a transparent background and sits directly on `--paper`; empty slots still use `--paper-2`. The hero portrait is immediately visible rather than revealed, so the entrance animation does not delay LCP. About uses a seated 3:4 portrait with a neutral background. Generation prompts are recorded in `docs/hero-portrait.md` and `docs/about-portrait.md`.

- **No photos until the AI portraits exist (DESIGN.md §11).** Until then, each portrait slot is an empty frame: a sharp `--paper-2` block at the portrait's crop (hero 4:5, About 3:4) with one mono `label` caption, e.g. "Portrait of Dr. Kael · forthcoming". The hero's decorative leader-line callout anchors to the frame just as it would to a photo. The site can go public like this, because nobody's face stands in for Dr. Kael.
- **`content/portraits.ts`** exports `{ hero, about }`, each either `{ src, alt }` (a static import from `content/portraits/`) or `null`. A `Portrait` component renders the image when it's there and the frame otherwise. Portraits get their own module, not `content/site.ts`, because the client Explorer imports `SECTIONS` from `site.ts` and shouldn't pull in image metadata.
- **The frame isn't a `placeholder()`.** It's a finished, shippable state, so the remaining-placeholders count doesn't include it. The portrait effort adds the files and fills in the two entries, and no config changes.
- **Rendering with `next/image`** (once the files exist):
  - hero: `loading="eager"` and `fetchPriority="high"`, following the installed Next image guide's preference over `preload` for a discoverable hero image; responsive `sizes` capped at 480px on wide screens, then `40vw` on desktop and `100vw` on mobile;
  - About: lazy (the default);
  - both: `placeholder="empty"` on the same `--paper-2` frame, because a blur blob doesn't suit the flat page;
  - no `remotePatterns`, and the default `images.qualities` (`[75]`).

## Contact form

- **Split:** `components/sections/contact.tsx` (server) renders the address, hours and phone from `content/site.ts`, next to `ContactForm`, a client component.
- **Fields:** name, email, phone (optional), reason for visit, and preferred time. Validation uses native attributes (`required`, `type="email"`, `type="tel"` with a `pattern`, `maxLength`). The submit handler reads `valueMissing`, `typeMismatch` and `patternMismatch` from each control's `ValidityState`. Each error uses shadcn `FieldError`, in `--oxblood` with a lucide icon. The error copy lives in `content/site.ts`. Controls receive `aria-invalid` and `aria-describedby` pointing to their error.
- **Preferred time** is a shadcn `FieldSet` with `FieldLegend` and native radios (Morning / Afternoon / No preference), preselected to No preference, so it never errors.
- **Timing:** validate on submit, then re-validate on change after the first submit attempt. On a failed submit, keyboard focus goes to the first invalid field in DOM order.
- **On success**, the form is replaced by the `--surface` panel with `role="status"`, and keyboard focus moves to it. Nothing is sent or stored, and the values are dropped.
- **No-JS submit:** the form sets `noValidate`, so there is no validation without JS. The form's `action` is a client function, which React server-renders as an inert action: a no-JS submit does nothing and never puts the Visitor's name or phone into a URL. The form never gets a real `action` URL.

## Consequences

- **Client islands outside the Brain Explorer:** `MobileNavSheet` and `ContactForm`, plus the inline reveal script. A new `"use client"` elsewhere needs a reason.
- **New dependencies:** none. Base UI is already installed. Contact adds local shadcn form components with DESIGN.md styling, including `Label` and `Separator` dependencies from the registry. The Explorer's tool rail and chips decide their own presentation.
- **Testing:** these sections have no pure logic, so there's nothing new for `bun test` beyond the placeholder count. They are checked in the browser: with JS disabled (everything visible, and a form submit does nothing), with reduced motion on, at mobile width (sheet focus and the jump after close), and keyboard-only through the form.
- **Unchanged:** the Brain Explorer's mobile bottom sheet (Base UI also ships a `Drawer`) and its lazy loading belong to the Explorer's own work.
