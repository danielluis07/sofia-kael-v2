import { ExplorerStage } from "@/components/explorer/explorer-stage";
import { ExplorerProvider } from "@/components/explorer/explorer-store";
import { SectionTitle, useSectionTitleId } from "@/components/section";
import { EXPLORER, SECTIONS } from "@/content/site";

/**
 * The server-rendered stage (DESIGN.md §9 "Stage"): full-bleed `--paper-2`,
 * one screen tall below the nav, with a compact opening above the client
 * Explorer island so the headline stays clear of the specimen.
 */
export function BrainExplorer() {
  const id = SECTIONS[2].id;
  const titleId = useSectionTitleId(id);
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="relative grid h-[calc(100svh-var(--nav-h))] min-h-120 grid-rows-[auto_minmax(0,1fr)] scroll-mt-(--nav-h) overflow-hidden border-t border-ink bg-paper-2">
      <div className="gutter mx-auto w-full max-w-content py-6 md:py-8">
        <SectionTitle id={titleId} eyebrow={EXPLORER.eyebrow} headline={EXPLORER.headline} className="max-w-xl gap-3 [&_h2]:text-display-m" />
      </div>
      <div className="relative min-h-0">
        <ExplorerProvider>
          <ExplorerStage />
        </ExplorerProvider>
      </div>
    </section>
  );
}
