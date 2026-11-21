"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import CardFace from "@/components/play/CardFace";
import RevealHeading from "@/components/ui/RevealHeading";
import { playProjects } from "@/data/projects";
import { site } from "@/data/site";
import { useMarquee } from "@/hooks/useMarquee";

const EASE = [0.22, 1, 0.36, 1] as const;
const CARD = "[data-expl-card]";

/**
 * Exploration — every non-featured project in a seamless, endlessly moving
 * row (useMarquee). Hover/focus on a card stops it and the card widens from
 * W to 1.8W (pure CSS); drag or swipe moves it by hand. Pause/Play button in
 * the header; reduced motion starts paused.
 */
export default function ExplorationSection() {
  const reduce = !!useReducedMotion();
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const inView = useInView(viewport, { once: true, amount: 0.25 });
  const { heading, regionLabel, hint, pause, play, speed, resumeDelay } = site.exploration;

  /* null = follow the motion preference until the visitor presses the button. */
  const [choice, setChoice] = useState<boolean | null>(null);
  const paused = choice ?? reduce;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useMarquee(viewport, track, { speed, resumeDelay, paused: !mounted || paused, card: CARD });

  return (
    <section id="exploration" aria-labelledby="exploration-title" className="play-zone expl-zone py-(--section-y)">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-(--gutter)">
        <RevealHeading
          id="exploration-title"
          text={heading}
          className="font-serif text-[clamp(2.75rem,9vw,6.5rem)] leading-none font-normal tracking-[-0.02em]"
        />
        <div className="flex items-center gap-4 text-[13px]">
          <span>{hint}</span>
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setChoice(!paused)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-current/25 px-4 font-medium transition-colors hover:bg-(--play-ink) hover:text-(--play-bg)"
          >
            {paused ? play : pause}
          </button>
        </div>
      </div>

      <div
        ref={viewport}
        role="region"
        aria-label={regionLabel}
        className="expl-scroller mt-10 sm:mt-14"
      >
        <ul ref={track} className="flex w-max gap-[calc(var(--w)*0.08)] px-(--gutter) py-4 will-change-transform">
          {[0, 1].flatMap((copy) =>
            playProjects.map((project, i) => (
              <motion.li
                key={`${copy}-${project.slug}`}
                data-expl-card
                /* Second copy only exists for the seamless loop: hidden from AT, not focusable. */
                data-loop-start={copy === 1 && i === 0 ? "" : undefined}
                aria-hidden={copy === 1 || undefined}
                inert={copy === 1 || undefined}
                initial={reduce ? false : { opacity: 0, x: 40 }}
                animate={inView || reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
                transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 6) * 0.07 }}
                className="expl-item shrink-0"
              >
                {/* Only a card with an external link is clickable (View cursor); the rest are display only. */}
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${project.title}, ${site.contact.ui.newTab}`}
                    data-cursor="View"
                    draggable={false}
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="block rounded-[calc(var(--w)*0.08)] focus-visible:outline-offset-4"
                  >
                    <CardFace project={project} sizes="(min-width: 768px) 45vw, 80vw" />
                  </a>
                ) : (
                  <CardFace project={project} sizes="(min-width: 768px) 45vw, 80vw" />
                )}
              </motion.li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
