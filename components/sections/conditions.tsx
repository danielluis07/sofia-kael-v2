import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { CONDITIONS, conditionRowId } from "@/content/conditions";
import { CONDITIONS_SECTION, SECTIONS } from "@/content/site";
import { STRUCTURES } from "@/content/structures";
import { conditionFocusHref, JUMP_ATTRIBUTE } from "@/lib/brain/explorer-url";
import { cn } from "@/lib/utils";

/**
 * The Conditions index (DESIGN.md §8.3): hairline rows, not cards. "See it in
 * the brain →" is a plain link that works without JS; the Explorer's client
 * code intercepts it to scroll, focus the Condition and push history (ADR 0005).
 * Each row is the target of its Condition's chips in the Structure panel.
 */
export function Conditions() {
  return (
    <Section
      id={SECTIONS[1].id}
      eyebrow={CONDITIONS_SECTION.eyebrow}
      headline={CONDITIONS_SECTION.headline}
      lede={CONDITIONS_SECTION.lede}>
      <ul role="list" className="flex flex-col border-t border-rule">
        {CONDITIONS.map((condition) => {
          const rowId = conditionRowId(condition.id);
          return (
            <Reveal
              as="li"
              key={condition.id}
              id={rowId}
              aria-labelledby={`${rowId}-name`}
              // A chip jump moves keyboard focus here; it isn't a Tab stop.
              tabIndex={-1}
              className="grid scroll-mt-(--nav-h) gap-x-(--col-gap) gap-y-5 border-b border-rule py-8 outline-none md:grid-cols-12 md:py-10">
              <h3 id={`${rowId}-name`} className="font-serif text-display-m text-ink md:col-span-5">
                {condition.name}
              </h3>
              <div className="flex flex-col items-start gap-4 md:col-span-6 md:col-start-7">
                <p className="max-w-prose text-body text-ink-soft">{condition.oneLiner}</p>
                <ul role="list" aria-label={CONDITIONS_SECTION.structuresLabel} className="label flex flex-wrap text-ink-soft">
                  {condition.structures.map((id, index) => (
                    <li key={id} className="whitespace-pre">
                      {index > 0 ? <span aria-hidden="true"> · </span> : null}
                      {STRUCTURES[id].name}
                    </li>
                  ))}
                </ul>
                <a
                  href={conditionFocusHref(condition.id)}
                  {...{ [JUMP_ATTRIBUTE]: "" }}
                  // The row's heading says which Condition, for a list of links out of context.
                  aria-describedby={`${rowId}-name`}
                  className={cn(buttonVariants({ variant: "link" }))}>
                  {/* One run, so the underline carries on under the arrow. */}
                  <span>
                    {CONDITIONS_SECTION.seeInBrain} <span aria-hidden="true">→</span>
                  </span>
                </a>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
