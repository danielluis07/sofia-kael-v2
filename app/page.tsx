import { ArrowUpRight, CircleDot, Move3d } from "lucide-react";
import { Button } from "@/components/ui/button";

const conditions = [
  { name: "Migraine", note: "Patterns, triggers, and a plan that holds." },
  { name: "Memory changes", note: "A careful look at what has changed." },
  {
    name: "Movement disorders",
    note: "Clarity for tremor, balance, and motion.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="gutter mx-auto flex max-w-content items-center justify-between border-b border-rule py-5">
        <a href="#top" className="font-serif text-2xl tracking-tight">
          Kael Neurology
        </a>
        <div className="hidden items-center gap-7 md:flex">
          <a
            className="label text-ink-soft transition-colors hover:text-oxblood"
            href="#approach">
            Approach
          </a>
          <a
            className="label text-ink-soft transition-colors hover:text-oxblood"
            href="#conditions">
            Conditions
          </a>
          <a
            className="label text-ink-soft transition-colors hover:text-oxblood"
            href="#contact">
            Contact
          </a>
        </div>
        <Button size="sm" className="hidden sm:inline-flex">
          Book a consultation
        </Button>
      </nav>

      <section
        id="top"
        className="gutter mx-auto grid max-w-content items-center gap-16 py-20 md:grid-cols-12 md:py-32">
        <div className="animate-[rise-in_700ms_var(--ease-out-soft)_both] md:col-span-7">
          <p className="label mb-7 text-oxblood">
            General clinical neurology · Boston
          </p>
          <h1 className="max-w-4xl font-serif text-display-xl text-ink">
            Clear answers for the brain&apos;s{" "}
            <em className="text-oxblood">hardest</em> questions.
          </h1>
          <p className="mt-8 max-w-xl text-body-l text-ink-soft">
            Thoughtful, unhurried care for the moments when something feels
            different and you want to understand why.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Button size="lg">
              Book a consultation <ArrowUpRight />
            </Button>
            <a
              className="font-medium text-ink underline decoration-rule underline-offset-8 transition-colors hover:decoration-oxblood"
              href="#approach">
              See the approach
            </a>
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden border border-ink bg-paper-2 md:col-span-5">
          <div className="absolute inset-8 border border-rule" />
          <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-[50%_45%_50%_42%] border border-ink bg-porcelain shadow-[18px_22px_0_rgba(93,87,82,0.12)] rotate-[-12deg]" />
          <div className="absolute left-[45%] top-[36%] size-24 -translate-x-1/2 rounded-[48%_52%_40%_60%] border border-oxblood bg-oxblood-tint/70" />
          <div className="absolute left-[54%] top-[57%] h-px w-28 bg-ink-soft" />
          <div className="absolute left-[78%] top-[56%] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
            Temporal lobe
          </div>
          <div className="absolute bottom-7 left-7 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
            <CircleDot className="size-3 text-oxblood" /> Plate 01 · Lateral
            view
          </div>
          <div className="absolute right-7 top-7 font-mono text-[10px] tabular-nums text-ink-soft">
            42° 21&apos; N<br />
            71° 03&apos; W
          </div>
        </div>
      </section>

      <section id="approach" className="border-t border-ink">
        <div className="gutter mx-auto grid max-w-content gap-12 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-5">
            <p className="label mb-5 text-ink-soft">The approach</p>
            <h2 className="font-serif text-display-l">
              Medicine with room to think.
            </h2>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <p className="max-w-lg text-body-l text-ink-soft">
              Neurology is precise work, but a visit should still feel human. We
              begin with your story, examine the details, and build a plan you
              can carry forward.
            </p>
            <blockquote className="mt-12 border-t border-rule pt-6 font-serif text-display-m italic text-oxblood">
              “Good care makes the unfamiliar legible.”
            </blockquote>
          </div>
        </div>
      </section>

      <section id="conditions" className="border-t border-ink">
        <div className="gutter mx-auto max-w-content py-20 md:py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label mb-5 text-ink-soft">What we treat</p>
              <h2 className="font-serif text-display-l">
                Start with what you notice.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-ink-soft">
              A first conversation is often the most useful test.
            </p>
          </div>
          <div className="border-t border-rule">
            {conditions.map((condition) => (
              <a
                key={condition.name}
                href="#contact"
                className="group grid gap-3 border-b border-rule py-6 transition-colors hover:bg-paper-2 md:grid-cols-[1fr_1.25fr_auto] md:items-center md:gap-8 md:px-4">
                <h3 className="font-serif text-display-m">{condition.name}</h3>
                <p className="text-sm text-ink-soft">{condition.note}</p>
                <ArrowUpRight className="size-5 text-oxblood transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-ink bg-paper-2">
        <div className="gutter mx-auto grid max-w-content gap-12 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-5">
            <p className="label mb-5 text-ink-soft">A first conversation</p>
            <h2 className="font-serif text-display-l">
              Let&apos;s make a clear next step.
            </h2>
            <div className="mt-10 flex items-center gap-3 text-sm text-ink-soft">
              <Move3d className="size-4 text-oxblood" /> A quiet practice for
              complex questions.
            </div>
          </div>
          <form className="grid gap-8 md:col-span-5 md:col-start-8">
            <label className="label text-ink-soft">
              Your name
              <input
                className="mt-3 block w-full border-0 border-b border-ink-soft bg-transparent px-0 py-3 font-sans text-base normal-case tracking-normal outline-none placeholder:text-ink-soft/60 focus:border-oxblood"
                placeholder="Sofia Kael"
              />
            </label>
            <label className="label text-ink-soft">
              Email address
              <input
                type="email"
                className="mt-3 block w-full border-0 border-b border-ink-soft bg-transparent px-0 py-3 font-sans text-base normal-case tracking-normal outline-none placeholder:text-ink-soft/60 focus:border-oxblood"
                placeholder="you@example.com"
              />
            </label>
            <label className="label text-ink-soft">
              What brings you in?
              <textarea
                className="mt-3 block min-h-24 w-full resize-y border-0 border-b border-ink-soft bg-transparent px-0 py-3 font-sans text-base normal-case tracking-normal outline-none placeholder:text-ink-soft/60 focus:border-oxblood"
                placeholder="Tell us a little about what you have noticed."
              />
            </label>
            <Button type="submit" className="w-fit">
              Request a call <ArrowUpRight />
            </Button>
          </form>
        </div>
      </section>

      <footer className="gutter mx-auto flex max-w-content flex-col gap-4 border-t border-rule py-8 text-sm text-ink-soft md:flex-row md:items-end md:justify-between">
        <p className="font-serif text-xl text-ink">Kael Neurology</p>
        <p className="max-w-md text-left md:text-right">
          Dr. Sofia Kael and Kael Neurology are fictional. This site is a design
          project and does not provide medical advice.
        </p>
      </footer>
    </main>
  );
}
