import { buttonVariants } from "@/components/ui/button";
import { MobileNavSheet } from "@/components/mobile-nav-sheet";
import { NAV, SECTIONS, sectionHref } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Sticky top bar (DESIGN.md §8, ADR 0005 "Navigation"). Its height is `--nav-h`,
 * and `.site-nav` in globals.css fades the hairline in on scroll. Below `md` the
 * links move into the full-screen mobile sheet.
 */
export function SiteNav() {
  return (
    <header className="site-nav sticky top-0 z-40 h-(--nav-h) border-b bg-paper">
      <div className="gutter mx-auto flex h-full max-w-content items-center justify-between gap-8">
        <a href="#top" className="font-serif text-2xl tracking-tight text-ink">
          {NAV.wordmark}
        </a>
        <nav aria-label={NAV.navigationLabel} className="hidden md:block">
          <ul className="flex items-center gap-4 lg:gap-7">
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
        <a href={sectionHref("contact")} className={cn(buttonVariants({ size: "sm" }), "hidden lg:inline-flex")}>
          {NAV.consultation}
        </a>
        <MobileNavSheet />
      </div>
    </header>
  );
}
