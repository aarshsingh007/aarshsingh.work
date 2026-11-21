import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { featuredProjects, getProject } from "@/data/projects";
import { site } from "@/data/site";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return featuredProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.title, description: `${project.title} — ${project.tag}` } : {};
}

/* Minimal case-study page until the real case studies are written. */
export default async function CaseStudyPage({ params }: Params) {
  const project = getProject((await params).slug);
  if (!project) notFound();

  return (
    <main className="flex min-h-dvh flex-col px-(--gutter)">
      <div className="flex h-(--nav-h) items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center text-[14px] font-medium">
          {site.name}
          <sup className="ml-0.5 text-[0.6em]">{site.mark}</sup>
        </Link>
        <Link
          href="/#work"
          className="group relative inline-flex min-h-11 items-center gap-1 text-[14px]"
        >
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-300 ease-out group-hover:-translate-x-1 group-focus-visible:-translate-x-1 motion-reduce:transition-none"
          >
            ←
          </span>{" "}
          {site.work.back}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-2.5 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
          />
        </Link>
      </div>

      <article className="flex flex-1 flex-col justify-center pb-(--nav-h)">
        <p className="text-[11px] font-medium tracking-[0.12em] uppercase">{project.tag}</p>
        <h1 className="mt-4 font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.95] font-normal tracking-[-0.02em]">
          <span className="mr-[0.3em] inline-block align-top text-[0.4em] leading-[1.6] tabular-nums">
            {project.number}
          </span>
          {project.title}
        </h1>
        <p className="mt-8">
          <span className="bg-lime px-2 py-1 text-[14px] font-medium">{site.work.comingSoon}</span>
        </p>
      </article>
    </main>
  );
}
