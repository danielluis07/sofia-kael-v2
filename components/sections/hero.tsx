import { Reveal } from "@/components/reveal";
import { buttonVariants } from "@/components/ui/button";
import { HERO, sectionHref } from "@/content/site";
import { cn } from "@/lib/utils";

/** DESIGN.md §8.1. Sized to its content; the portrait arrives with its own slice. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div className="gutter mx-auto grid max-w-content gap-x-(--col-gap) py-20 md:grid-cols-12 md:py-32">
        <div className="flex flex-col gap-8 md:col-span-7">
          <Reveal as="p" className="label text-oxblood">
            {HERO.eyebrow}
          </Reveal>
          <Reveal as="h1" index={1} id="hero-title" className="font-serif text-display-xl text-ink">
            {HERO.headline.before}
            <em className="text-oxblood">{HERO.headline.accent}</em>
            {HERO.headline.after}
          </Reveal>
          <Reveal as="p" index={2} className="max-w-xl text-body-l text-ink-soft">
            {HERO.lede}
          </Reveal>
          <Reveal index={3} className="flex flex-wrap items-center gap-6">
            <a href={sectionHref("contact")} className={buttonVariants({ size: "lg" })}>
              {HERO.consultation}
            </a>
            <a href={sectionHref("brain-explorer")} className={cn(buttonVariants({ variant: "link" }))}>
              {HERO.explore}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
