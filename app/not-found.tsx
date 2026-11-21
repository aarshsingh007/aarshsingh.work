import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col px-(--gutter)">
      <div className="flex h-(--nav-h) items-center">
        <Link href="/" className="inline-flex min-h-11 items-center text-[14px] font-medium">
          {site.name}
          <sup className="ml-0.5 text-[0.6em]">{site.mark}</sup>
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pb-(--nav-h) text-center">
        <p className="text-[14px]">404</p>
        <h1 className="mt-4 font-serif text-[clamp(3rem,13vw,9rem)] leading-[0.95] font-normal tracking-[-0.02em]">
          Page{" "}
          <span className="relative isolate inline-block pr-[0.06em] italic">
            <span aria-hidden="true" className="absolute inset-x-[-0.06em] top-[42%] bottom-[10%] -z-10 bg-lime" />
            not
          </span>{" "}
          found
        </h1>
        <Link
          href="/"
          className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-[4px] bg-ink px-6 text-[15px] font-medium text-bg transition-[color,background-color,scale] hover:bg-lime hover:text-ink focus-visible:bg-lime focus-visible:text-ink active:scale-[0.97] motion-reduce:active:scale-100"
        >
          Back home <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
