import { Section } from "@/components/section";
import { FIRST_VISIT, SECTIONS } from "@/content/site";

export function FirstVisit() {
  return (
    <Section id={SECTIONS[3].id} eyebrow={FIRST_VISIT.eyebrow} headline={FIRST_VISIT.headline} lede={FIRST_VISIT.lede} />
  );
}
