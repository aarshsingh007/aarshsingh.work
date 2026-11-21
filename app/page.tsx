import About from "@/components/about/About";
import ContactSection from "@/components/contact/ContactSection";
import Cursor from "@/components/cursor/Cursor";
import ExplorationSection from "@/components/exploration/ExplorationSection";
import HeroStage from "@/components/hero/HeroStage";
import IntroProvider from "@/components/IntroProvider";
import Nav from "@/components/nav/Nav";
import PlaySection from "@/components/play/PlaySection";
import RevealHeading from "@/components/ui/RevealHeading";
import WorkSheets from "@/components/work/WorkSheets";
import { site } from "@/data/site";

export default function Home() {
  return (
    <IntroProvider>
      <Nav />
      {/* The nav is fixed; main reserves its height so nothing jumps. */}
      <main className="pt-(--nav-h)">
        <HeroStage />
        <WorkSheets />
        <About />
        <PlaySection />
        <ExplorationSection />
        <ContactSection />

        {/* Placeholder sections — anchors for the nav. Content comes later. */}
        {site.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className="border-t border-ink/10 px-(--gutter) py-(--section-y)"
          >
            <RevealHeading
              id={`${section.id}-title`}
              text={section.title}
              className="font-serif text-[clamp(2.75rem,9vw,6.5rem)] leading-none font-normal tracking-[-0.02em]"
            />
            <p className="mt-4 text-[15px]">This section hasn&apos;t been built yet.</p>
          </section>
        ))}
      </main>
      <Cursor />
    </IntroProvider>
  );
}
