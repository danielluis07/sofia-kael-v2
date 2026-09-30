import { SectionTitle, useSectionTitleId } from "@/components/section";
import { EXPLORER, SECTIONS } from "@/content/site";

/**
 * The server-rendered stage (DESIGN.md §9 "Stage"): full-bleed `--paper-2`,
 * one screen tall below the nav, with the opening overlaid top-left. The
 * client Explorer island mounts inside it later.
 */
export function BrainExplorer() {
  const id = SECTIONS[2].id;
  const titleId = useSectionTitleId(id);
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="relative h-[calc(100svh-var(--nav-h))] min-h-120 scroll-mt-(--nav-h) border-t border-ink bg-paper-2">
      <div className="gutter absolute inset-x-0 top-0 mx-auto max-w-content pt-12 md:pt-16">
        <SectionTitle id={titleId} eyebrow={EXPLORER.eyebrow} headline={EXPLORER.headline} className="max-w-xl" />
      </div>
    </section>
  );
}
