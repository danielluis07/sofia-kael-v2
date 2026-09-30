import { Section } from "@/components/section";
import { CONDITIONS_SECTION, SECTIONS } from "@/content/site";

export function Conditions() {
  return (
    <Section
      id={SECTIONS[1].id}
      eyebrow={CONDITIONS_SECTION.eyebrow}
      headline={CONDITIONS_SECTION.headline}
      lede={CONDITIONS_SECTION.lede}
    />
  );
}
