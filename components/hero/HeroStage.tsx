"use client";

import { useIntroReady } from "@/components/IntroProvider";
import PlayRow, { type RowItem } from "@/components/play/PlayRow";
import { playProjects } from "@/data/projects";
import { site } from "@/data/site";
import Hero from "./Hero";

/* Hello card centred between these four explorations (picked by slug, so reordering Exploration doesn't change the hero). */
const HERO_SLUGS = ["field-research", "first-year-color-module", "photography", "adobe-workshop-branding"];
const preview = HERO_SLUGS.flatMap((slug): RowItem[] => {
  const project = playProjects.find((p) => p.slug === slug);
  return project ? [{ key: project.slug, kind: "project", project }] : [];
});
const ITEMS: RowItem[] = [...preview.slice(0, 2), { key: "hello", kind: "hello" }, ...preview.slice(2)];

/**
 * Hero + card row — normal document flow, no sticky, no scroll-linked transforms.
 * The hero content block sits at ~76dvh; the card row follows directly below
 * so the top ~20-25% of the cards peek in on the first screen.
 */
export default function HeroStage() {
  const ready = useIntroReady();

  return (
    <div className="hero-stage">
      <Hero />

      <div className="hero-row play-tokens hero-cards pb-8">
        {/* In the hero the cards fan up with the intro, not on scroll-into-view. */}
        <PlayRow items={ITEMS} label={site.play.previewLabel} show={ready} />
      </div>

    </div>
  );
}
