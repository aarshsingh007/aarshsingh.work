"use client";

import { motion } from "framer-motion";
import { useIntroReady } from "@/components/IntroProvider";
import { site } from "@/data/site";
import Badge from "@/components/ui/Badge";
import MagneticButton from "./MagneticButton";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Choreography in seconds after the intro completes — everything settles by ~1.45s. */
const T = {
  line: 0.1,
  lineStep: 0.12,
  lineDur: 0.8,
  highlight: 0.55,
  highlightDur: 0.6,
  sub: 0.75,
  cta: 0.85,
  badge: 0.9,
  fadeDur: 0.55,
};

const HEADLINE =
  "hero-headline text-center font-serif text-[clamp(3.5rem,min(18vw,21vh),12rem)] leading-[0.92] font-normal tracking-[-0.02em]";
const LINE = "-mb-[0.14em] block overflow-hidden pb-[0.14em]";
const WORD = (italic?: boolean) => `relative isolate inline-block ${italic ? "pr-[0.06em] italic" : ""}`;

export default function Hero() {
  const ready = useIntroReady();

  const fade = (delay: number) => ({
    "data-animate": true,
    initial: { opacity: 0 },
    animate: { opacity: ready ? 1 : 0 },
    transition: { duration: T.fadeDur, ease: "easeOut" as const, delay },
  });

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex h-[76dvh] min-h-0 flex-col items-center justify-center px-(--gutter)"
    >
      {/* Badge: above the headline on mobile, top-right on larger screens. */}
      <motion.div
        {...fade(T.badge)}
        className="mb-6 w-24 self-end sm:absolute sm:top-[3%] sm:right-[5%] sm:mb-0 sm:w-32 lg:top-[10%] lg:right-[14%] lg:w-40"
      >
        <Badge text={site.hero.badge} />
      </motion.div>

      {/* Headline: no pointer effect (HEADLINE_HOVER). The tool trail skips it plus 24px around. */}
      <div data-no-trail="" data-no-trail-pad={24}>
        <h1 id="hero-title" className={HEADLINE}>
          {site.hero.headline.map((line, i) => (
            <span key={line.text} className={LINE}>
              <motion.span
                data-animate
                initial={{ y: "105%", opacity: 0 }}
                animate={ready ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
                transition={{ duration: T.lineDur, ease: EASE, delay: T.line + i * T.lineStep }}
                className={WORD(line.italic)}
              >
                {line.highlight && (
                  <motion.span
                    aria-hidden="true"
                    data-animate
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: ready ? 1 : 0 }}
                    transition={{ duration: T.highlightDur, ease: [0.65, 0, 0.35, 1], delay: T.highlight }}
                    className="absolute inset-x-[-0.06em] top-[42%] bottom-[10%] -z-10 origin-left bg-lime"
                  />
                )}
                {line.text}
              </motion.span>
            </span>
          ))}
        </h1>
      </div>

      <motion.p {...fade(T.sub)} className="mt-6 text-center text-[15px] sm:mt-8 sm:text-[16px]">
        {site.hero.subline}
      </motion.p>

      <motion.div {...fade(T.cta)} className="mt-7 sm:mt-9">
        <MagneticButton href={site.hero.cta.href} cursorLabel="View">
          {site.hero.cta.label}
        </MagneticButton>
      </motion.div>
    </section>
  );
}
