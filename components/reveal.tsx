import type { ComponentPropsWithoutRef, CSSProperties, ElementType, HTMLAttributes } from "react";

type RevealProps<T extends ElementType> = {
  as?: T;
  /** Stagger position within a group; capped at 5 by the CSS (ADR 0005). */
  index?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * Marks server markup for the one-time fade-and-rise (ADR 0005 "Reveal").
 * Nothing is hidden unless `RevealScript` runs, and the script sets
 * `data-revealed` before hydration, hence `suppressHydrationWarning`.
 */
export function Reveal<T extends ElementType = "div">({ as, index, style, ...props }: RevealProps<T>) {
  // R3F adds three.js elements to JSX, so the props of any `ElementType` collapse to `never`: render as plain HTML.
  const Component = (as ?? "div") as ElementType<HTMLAttributes<HTMLElement>>;
  const stagger = index ? ({ "--reveal-i": index } as CSSProperties) : undefined;
  return (
    <Component
      data-reveal=""
      suppressHydrationWarning
      style={{ ...stagger, ...style }}
      {...(props as HTMLAttributes<HTMLElement>)}
    />
  );
}

// Observe first, add `.reveal` last: if anything throws, nothing is hidden.
const script = `(() => {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-revealed", "");
      observer.unobserve(entry.target);
    }
  });
  document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
  document.documentElement.classList.add("reveal");
})();`;

/** Rendered once at the end of `<body>` so it runs before hydration. */
export function RevealScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
