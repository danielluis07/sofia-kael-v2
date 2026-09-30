import { Section } from "@/components/section";
import { FIRST_VISIT, SECTIONS } from "@/content/site";

export function FirstVisit() {
  return (
    <Section id={SECTIONS[3].id} eyebrow={FIRST_VISIT.eyebrow} headline={FIRST_VISIT.headline}>
      <div className="grid gap-x-(--col-gap) md:grid-cols-12">
        <div className="flex flex-col gap-12 md:col-span-7">
          <p className="max-w-xl text-body-l text-ink-soft">{FIRST_VISIT.lede}</p>
          <ol role="list" className="flex flex-col border-t border-rule">
            {FIRST_VISIT.steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-6 border-b border-rule py-8 sm:grid-cols-[3rem_1fr]">
                <span aria-hidden="true" className="pt-2 font-mono text-body-s tabular-nums text-oxblood">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-4">
                  <h3 className="font-serif text-display-m text-ink">{step.title}</h3>
                  <p className="max-w-prose text-body text-ink-soft">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {/* Columns 8–12 are reserved for the brain-derived section art. */}
      </div>
    </Section>
  );
}
