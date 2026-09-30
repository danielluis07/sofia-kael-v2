import { Reveal } from "@/components/reveal";
import { Portrait } from "@/components/portrait";
import { PORTRAITS } from "@/content/portraits";
import { buttonVariants } from "@/components/ui/button";
import { HERO, sectionHref } from "@/content/site";
import { cn } from "@/lib/utils";

/** DESIGN.md §8.1. Sized to its content, with the portrait in columns 8–12. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div className="gutter mx-auto grid max-w-content gap-x-(--col-gap) gap-y-12 py-20 md:grid-cols-12 md:items-center md:py-32">
        <div className="flex flex-col gap-8 md:col-span-7">
          <Reveal as="h1" id="hero-title" className="font-serif text-display-xl text-ink">
            {HERO.headline}
          </Reveal>
          <Reveal as="p" index={1} className="max-w-xl text-body-l text-ink-soft">
            {HERO.lede}
          </Reveal>
          <Reveal index={2} className="flex flex-wrap items-center gap-6">
            <a href={sectionHref("contact")} className={buttonVariants({ size: "lg" })}>
              {HERO.consultation}
            </a>
            <a href={sectionHref("brain-explorer")} className={cn(buttonVariants({ variant: "link" }))}>
              {HERO.explore}
            </a>
          </Reveal>
        </div>
        <div className="relative md:col-span-5 md:col-start-8 md:translate-y-8">
          <Portrait portrait={PORTRAITS.hero} crop="hero" />
          <div aria-hidden="true" className="pointer-events-none flex items-center gap-3 pt-4">
            <span className="relative flex h-6 w-12 shrink-0 items-end border-b border-ink-soft before:absolute before:top-0 before:right-0 before:h-6 before:border-r before:border-ink-soft">
              <span className="absolute -top-1 -right-[3px] size-2 rounded-full border-[1.5px] border-oxblood bg-paper" />
            </span>
            <p className="label text-ink-soft">{HERO.portraitCallout}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
