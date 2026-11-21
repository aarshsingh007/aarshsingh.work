import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExploration, playProjects } from "@/data/projects";
import { site } from "@/data/site";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return playProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = getExploration((await params).slug);
  if (!project) return {};
  const tag = project.tag ?? site.play.fallbackTag;
  return { title: project.title, description: `${project.title} — ${tag}` };
}

/* Minimal exploration page until details are written. */
export default async function ExplorationPage({ params }: Params) {
  const project = getExploration((await params).slug);
  if (!project) notFound();
  const tag = project.tag ?? site.play.fallbackTag;
  const { comingSoon, back, visit } = site.exploration;

  return (
    <main className="play-zone flex min-h-dvh flex-col px-(--gutter)">
      <div className="flex h-(--nav-h) items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center text-[14px] font-medium">
          {site.name}
          <sup className="ml-0.5 text-[0.6em]">{site.mark}</sup>
        </Link>
        <Link href="/#exploration" className="group relative inline-flex min-h-11 items-center gap-1 text-[14px]">
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-300 ease-out group-hover:-translate-x-1 group-focus-visible:-translate-x-1 motion-reduce:transition-none"
          >
            ←
          </span>{" "}
          {back}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-2.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
          />
        </Link>
      </div>

      <article className="flex flex-1 flex-col justify-center pb-(--nav-h)">
        <p className="text-[13px]">{tag}</p>
        <h1 className="mt-4 font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.95] font-normal tracking-[-0.02em]">
          {project.title}
        </h1>
        <p className="mt-8 flex flex-wrap items-center gap-6">
          <span className="rounded-[4px] bg-(--frame-peach) px-2 py-1 text-[14px] font-medium">{comingSoon}</span>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-[14px] font-medium underline underline-offset-4"
            >
              {visit}&nbsp;<span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </p>
      </article>
    </main>
  );
}
