import { Section } from "@/components/section";
import { CREDENTIALS } from "@/content/site";

export function Credentials() {
  return (
    <Section eyebrow={CREDENTIALS.eyebrow} headline={CREDENTIALS.headline} lede={CREDENTIALS.lede}>
      <div className="grid gap-x-(--col-gap) gap-y-16 md:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-8 md:col-span-6">
          <h3 className="label text-ink-soft">{CREDENTIALS.trainingLabel}</h3>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_6rem]">
            <ul role="list" className="flex flex-col border-l border-rule">
              {CREDENTIALS.training.map((entry) => (
                <li key={entry.years} className="relative flex flex-col gap-3 pb-8 pl-6 last:pb-0">
                  <span aria-hidden="true" className="absolute top-1 -left-[3px] size-[5px] bg-ink-soft" />
                  <p className="font-mono text-body-s tabular-nums text-ink">{entry.years}</p>
                  <p className="max-w-prose text-body text-ink-soft">{entry.text}</p>
                </li>
              ))}
            </ul>
            <div aria-hidden="true" className="hidden flex-col gap-3 pt-16 md:flex">
              <svg width="80" height="32" viewBox="0 0 80 32" fill="none" className="shrink-0">
                <circle cx="4" cy="28" r="3.25" className="stroke-oxblood" strokeWidth="1.5" />
                <path d="M8 28H48L72 4" className="stroke-ink-soft" strokeWidth="1" />
              </svg>
              <span className="label text-ink-soft">{CREDENTIALS.trainingCallout}</span>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-8 md:col-span-5 md:col-start-8">
          <h3 className="label text-ink-soft">{CREDENTIALS.publicationsLabel}</h3>
          <ul role="list" className="flex flex-col border-t border-rule">
            {CREDENTIALS.publications.map((publication) => (
              <li key={publication.title} className="flex flex-col gap-4 border-b border-rule py-8 first:pt-6">
                <h4 className="font-serif text-display-m text-ink">{publication.title}</h4>
                <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-body-s text-ink-soft">
                  <span>{publication.venue}</span>
                  <span className="font-mono tabular-nums">{publication.year}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
