import { ExplorerStage } from "@/components/explorer/explorer-stage";
import { ExplorerProvider } from "@/components/explorer/explorer-store";
import { SectionTitle, useSectionTitleId } from "@/components/section";
import { EXPLORER, SECTIONS } from "@/content/site";

/**
 * The server-rendered stage (DESIGN.md §9 "Stage"): full-bleed `--paper-2`,
 * one screen tall below the nav, with the opening overlaid top-left over the
 * client Explorer island.
 */
export function BrainExplorer() {
  const id = SECTIONS[2].id;
  const titleId = useSectionTitleId(id);
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="relative h-[calc(100svh-var(--nav-h))] min-h-120 scroll-mt-(--nav-h) overflow-hidden border-t border-ink bg-paper-2">
      <ExplorerProvider>
        <ExplorerStage />
      </ExplorerProvider>
      {/* Drags that start on the opening still reach the specimen. */}
      <div className="gutter pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-content pt-12 md:pt-16">
        <SectionTitle id={titleId} eyebrow={EXPLORER.eyebrow} headline={EXPLORER.headline} className="max-w-xl" />
      </div>
    </section>
  );
}
