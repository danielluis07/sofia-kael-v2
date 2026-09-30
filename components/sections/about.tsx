import { Section } from "@/components/section";
import { Portrait } from "@/components/portrait";
import { Reveal } from "@/components/reveal";
import { PORTRAITS } from "@/content/portraits";
import { ABOUT, SECTIONS } from "@/content/site";

export function About() {
  return (
    <Section id={SECTIONS[0].id} eyebrow={ABOUT.eyebrow} headline={ABOUT.headline} lede={ABOUT.lede}>
      <div className="grid gap-x-(--col-gap) gap-y-12 md:grid-cols-12 md:items-center">
        <Reveal className="md:col-span-4 md:col-start-2">
          <Portrait portrait={PORTRAITS.about} crop="about" />
        </Reveal>
        <div className="flex flex-col gap-10 md:col-span-6 md:col-start-7">
          <Reveal as="p" index={1} className="max-w-xl text-body text-ink-soft">
            {ABOUT.biography}
          </Reveal>
          <Reveal as="blockquote" index={2} className="max-w-xl font-serif text-display-m italic text-ink">
            <p>“{ABOUT.pullQuote}”</p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
