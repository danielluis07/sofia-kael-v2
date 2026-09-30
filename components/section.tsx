import { useId, type ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import type { SectionId } from "@/content/site";
import { cn } from "@/lib/utils";

type SectionProps = {
  /** From `SECTIONS`; Credentials has none (ADR 0005). */
  id?: SectionId;
  eyebrow: string;
  headline: string;
  lede?: string;
  className?: string;
  children?: ReactNode;
};

/** A page section with the DESIGN.md §4 opening, headline in columns 1–7 and lede in 8–12. */
export function Section({ id, eyebrow, headline, lede, className, children }: SectionProps) {
  const titleId = useSectionTitleId(id);
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("scroll-mt-(--nav-h) border-t border-ink", className)}>
      <div className="gutter section-y mx-auto flex max-w-content flex-col gap-16">
        <div className="grid gap-x-(--col-gap) gap-y-8 md:grid-cols-12 md:items-end">
          <SectionTitle id={titleId} eyebrow={eyebrow} headline={headline} className="md:col-span-7" />
          {lede ? (
            <Reveal as="p" index={2} className="max-w-xl text-body-l text-ink-soft md:col-span-5 md:col-start-8">
              {lede}
            </Reveal>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

/** The mono eyebrow and the `display-l` headline that labels its section. */
export function SectionTitle({
  id,
  eyebrow,
  headline,
  className,
}: {
  id: string;
  eyebrow: string;
  headline: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Reveal as="p" className="label text-ink-soft">
        {eyebrow}
      </Reveal>
      <Reveal as="h2" index={1} id={id} tabIndex={-1} className="font-serif text-display-l text-ink">
        {headline}
      </Reveal>
    </div>
  );
}

export function useSectionTitleId(id?: SectionId) {
  const generated = useId();
  return id ? `${id}-title` : generated;
}
