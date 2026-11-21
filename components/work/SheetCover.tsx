import Image from "next/image";
import type { Project, SheetLook } from "@/data/projects";

/*
 * Cover for a work sheet. Uses project.images[0] when present; otherwise a
 * decorative typographic placeholder in the project's one fixed look
 * (never changes on hover, scroll or focus):
 *   lime  — giant number cropped bottom-right, title top-left
 *   white — giant initial cropped left, title bottom-right
 *   black — giant number cropped top, title bottom-left
 */
const BOX: Record<SheetLook, string> = {
  lime: "bg-lime text-ink",
  white: "bg-bg text-ink",
  black: "bg-ink text-bg",
};

export default function SheetCover({ project }: { project: Project }) {
  const image = project.images?.[0];
  if (image) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        loading="lazy"
        sizes="(min-width: 1024px) 90vw, 100vw"
        className="object-cover"
      />
    );
  }

  const look = project.sheet ?? "lime";
  const title = "absolute max-w-[40cqw] font-sans text-[max(14px,2.4cqw)] leading-tight font-medium";

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${BOX[look]}`} style={{ containerType: "size" }}>
      {look === "lime" && (
        <>
          <span className="absolute -right-[3cqw] -bottom-[16cqh] font-serif text-[78cqh] leading-[0.8] italic">
            {project.number}
          </span>
          <span className={`${title} top-[7cqh] left-[4cqw]`}>{project.title}</span>
          <svg viewBox="0 0 160 90" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
            <circle cx="14" cy="74" r="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x="24" y="68" width="12" height="12" fill="currentColor" />
          </svg>
        </>
      )}

      {look === "white" && (
        <>
          <span className="absolute top-[2cqh] -left-[4cqw] font-serif text-[95cqh] leading-[0.8]">
            {project.title.charAt(0)}
          </span>
          <span className={`${title} right-[4cqw] bottom-[8cqh] text-right`}>{project.title}</span>
          <svg viewBox="0 0 160 90" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
            <path d="M104 34 A18 18 0 0 1 140 34 Z" fill="currentColor" />
            {[0, 1, 2].map((c) => (
              <rect key={c} x={104 + c * 12} y="40" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
            ))}
          </svg>
        </>
      )}

      {look === "black" && (
        <>
          <span className="absolute -top-[22cqh] right-[6cqw] font-serif text-[78cqh] leading-[0.8] italic">
            {project.number}
          </span>
          <span className={`${title} bottom-[8cqh] left-[4cqw]`}>{project.title}</span>
          <svg viewBox="0 0 160 90" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
            <line x1="8" y1="14" x2="56" y2="14" stroke="currentColor" strokeWidth="1" />
            <circle cx="20" cy="32" r="8" fill="var(--lime)" />
          </svg>
        </>
      )}
    </div>
  );
}
