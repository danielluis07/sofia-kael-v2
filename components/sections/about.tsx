import { Section } from "@/components/section";
import { ABOUT, SECTIONS } from "@/content/site";

export function About() {
  return <Section id={SECTIONS[0].id} eyebrow={ABOUT.eyebrow} headline={ABOUT.headline} lede={ABOUT.lede} />;
}
