import { Section } from "@/components/section";
import { ContactForm } from "@/components/contact-form";
import { CONTACT, SECTIONS } from "@/content/site";

export function Contact() {
  return (
    <Section id={SECTIONS[4].id} eyebrow={CONTACT.eyebrow} headline={CONTACT.headline} lede={CONTACT.lede}>
      <div className="grid gap-x-(--col-gap) gap-y-16 md:grid-cols-12">
        <div className="min-w-0 md:col-span-7">
          <ContactForm copy={CONTACT.form} />
        </div>
        <dl className="flex min-w-0 flex-col gap-12 md:col-span-4 md:col-start-9">
          <div className="flex flex-col gap-4">
            <dt className="label text-ink-soft">{CONTACT.addressLabel}</dt>
            <dd><address className="flex flex-col text-body not-italic">
              {CONTACT.addressLines.map((line) => <span key={line}>{line}</span>)}
            </address></dd>
          </div>
          <div className="flex flex-col gap-4">
            <dt className="label text-ink-soft">{CONTACT.hoursLabel}</dt>
            <dd className="flex flex-col gap-3 text-body tabular-nums">
              {CONTACT.hours.map(({ days, time }) => (
                <div key={days} className="flex flex-col gap-1">
                  <span>{days}</span><span>{time}</span>
                </div>
              ))}
            </dd>
          </div>
          <div className="flex flex-col gap-4">
            <dt className="label text-ink-soft">{CONTACT.phoneLabel}</dt>
            <dd><a href={CONTACT.phoneHref} className="text-body tabular-nums underline decoration-rule underline-offset-4 hover:decoration-oxblood">{CONTACT.phone}</a></dd>
          </div>
        </dl>
      </div>
    </Section>
  );
}
