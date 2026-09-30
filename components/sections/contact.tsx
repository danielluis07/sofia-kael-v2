import { Section } from "@/components/section";
import { CONTACT, SECTIONS } from "@/content/site";

export function Contact() {
  return <Section id={SECTIONS[4].id} eyebrow={CONTACT.eyebrow} headline={CONTACT.headline} lede={CONTACT.lede} />;
}
