import { FOOTER, SECTIONS, sectionHref } from "@/content/site";

/** DESIGN.md §8. The two lines are required; never remove them. */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink">
      <div className="gutter mx-auto grid max-w-content gap-x-(--col-gap) gap-y-10 py-16 md:grid-cols-12">
        <p className="font-serif text-2xl tracking-tight text-ink md:col-span-4">{FOOTER.wordmark}</p>
        <nav aria-label={FOOTER.navigationLabel} className="md:col-span-8">
          <ul className="flex flex-wrap gap-x-7 gap-y-1">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={sectionHref(section.id)}
                  className="label block py-2 text-ink-soft transition-colors duration-(--dur-fast) hover:text-oxblood">
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-3 border-t border-rule pt-8 text-body-s text-ink-soft md:col-span-12 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="flex max-w-2xl flex-col gap-2">
            <p>{FOOTER.attribution}</p>
            <p>{FOOTER.disclaimer}</p>
          </div>
          <a
            href="/models/CREDITS.md"
            className="inline-block w-fit shrink-0 py-1 text-ink underline decoration-rule underline-offset-4 transition-colors duration-(--dur-fast) hover:decoration-oxblood">
            {FOOTER.modelCredits}
          </a>
        </div>
      </div>
    </footer>
  );
}
