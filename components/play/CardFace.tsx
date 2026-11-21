import Image from "next/image";
import type { Project } from "@/data/projects";
import { site } from "@/data/site";

/**
 * The card face shared by the hero fan strip and the Exploration row:
 * frame (tone), media (image or flat cover + giant glyph), title, category.
 * All sizes come from --w. Colours come from the project's data.
 */
export default function CardFace({ project, sizes }: { project: Project; sizes: string }) {
  const tag = project.tag ?? site.play.fallbackTag;
  const image = project.images?.[0];
  return (
    <div className="play-card" style={{ background: `var(--frame-${project.tone ?? "blue"})` }}>
      <div className="play-media" style={image ? undefined : { background: `var(--cover-${project.cover ?? "pink"})` }}>
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            loading="lazy"
            sizes={sizes}
            className="object-cover"
            style={image.position ? { objectPosition: image.position } : undefined}
          />
        ) : (
          <span aria-hidden="true" className="play-glyph">
            {String(Number(project.number))}
          </span>
        )}
      </div>
      {project.downloadable && <span className="play-chip">{site.exploration.downloadable}</span>}
      <p className="play-title">{project.title}</p>
      <p className="play-cat">{tag}</p>
    </div>
  );
}
