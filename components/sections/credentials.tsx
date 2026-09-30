import { Section } from "@/components/section";
import { CREDENTIALS } from "@/content/site";

export function Credentials() {
  return <Section eyebrow={CREDENTIALS.eyebrow} headline={CREDENTIALS.headline} lede={CREDENTIALS.lede} />;
}
