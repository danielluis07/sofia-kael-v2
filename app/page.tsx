import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { About } from "@/components/sections/about";
import { BrainExplorer } from "@/components/sections/brain-explorer";
import { Conditions } from "@/components/sections/conditions";
import { Contact } from "@/components/sections/contact";
import { Credentials } from "@/components/sections/credentials";
import { FirstVisit } from "@/components/sections/first-visit";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <About />
        <Conditions />
        <BrainExplorer />
        <FirstVisit />
        <Credentials />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
