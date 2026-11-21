"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { createRef, useMemo, type RefObject } from "react";
import RevealHeading from "@/components/ui/RevealHeading";
import { featuredProjects as projects, type Project } from "@/data/projects";
import { site } from "@/data/site";
import { useFinePointer } from "@/hooks/useFinePointer";
import SheetCover from "./SheetCover";

const EASE = [0.22, 1, 0.36, 1] as const;

/** External case study (Figma deck) in a new tab when set; otherwise the /work/[slug] page. */
function SheetLink({
  project,
  ...props
}: { project: Project } & Omit<React.ComponentProps<"a">, "href" | "target" | "rel">) {
  if (project.link) {
    return (
      <a
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.title}, ${site.work.viewCase}, ${site.contact.ui.newTab}`}
        {...props}
      />
    );
  }
  return <Link href={`/work/${project.slug}`} {...props} />;
}

function Sheet({
  project,
  index,
  total,
  selfRef,
  nextRef,
  stacking,
}: {
  project: Project;
  index: number;
  total: number;
  selfRef: RefObject<HTMLLIElement | null>;
  nextRef: RefObject<HTMLLIElement | null>;
  stacking: boolean;
}) {
  const isLast = index === total - 1;

  /* Scale/fade while the next sheet slides over this one (scoped per sheet). */
  const { scrollYProgress } = useScroll({ target: nextRef, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, isLast ? 1 : 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, isLast ? 1 : 0.7]);

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <li ref={selfRef} className="work-sheet" style={{ "--i": index } as React.CSSProperties}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <motion.article
          style={stacking ? { scale, opacity, transformOrigin: "50% 0%" } : undefined}
          className="overflow-hidden rounded-[4px] border border-ink bg-bg"
        >
          {/* Only hover effect: the "View" cursor and the ↗ nudge. */}
          <SheetLink project={project} data-cursor="View" className="group block focus-visible:outline-offset-[-3px]">
            <div className="relative aspect-video max-h-[62vh] w-full overflow-hidden">
              <SheetCover project={project} />
            </div>

            <div className="grid grid-cols-1 gap-y-3 border-t border-ink px-5 py-5 sm:grid-cols-[minmax(9rem,auto)_1fr_auto] sm:items-baseline sm:gap-x-8 sm:px-7">
              <p className="text-[11px] font-medium tracking-[0.12em] uppercase tabular-nums">
                {counter}
                {project.tag && <span>&ensp;·&ensp;{project.tag}</span>}
              </p>

              <h3 className="font-serif text-[clamp(1.9rem,4vw,3.5rem)] leading-[1.02] font-normal tracking-[-0.02em]">
                {project.title}
              </h3>

              <span className="text-[13px] font-medium sm:text-right">
                {site.work.viewCase}{" "}
                <span aria-hidden="true" className="work-arrow inline-block">
                  ↗
                </span>
              </span>
            </div>
          </SheetLink>
        </motion.article>
      </motion.div>
    </li>
  );
}

/** Selected Work — full-width sheets that stack as you scroll (desktop). */
export default function WorkSheets() {
  const fine = useFinePointer();
  const reduce = !!useReducedMotion();
  const stacking = fine && !reduce;
  const refs = useMemo(() => projects.map(() => createRef<HTMLLIElement>()), []);

  return (
    <section id="work" aria-labelledby="work-title" className="border-t border-ink/10 px-(--gutter) py-(--section-y)">
      <RevealHeading
        id="work-title"
        text={site.work.heading}
        className="font-serif text-[clamp(2.75rem,9vw,6.5rem)] leading-none font-normal tracking-[-0.02em]"
      />

      <ol className="mt-10 flex flex-col gap-8 sm:mt-14 sm:gap-10">
        {projects.map((project, i) => (
          <Sheet
            key={project.slug}
            project={project}
            index={i}
            total={projects.length}
            selfRef={refs[i]}
            nextRef={refs[i + 1] ?? refs[i]}
            stacking={stacking}
          />
        ))}
      </ol>
    </section>
  );
}
