import { site } from "@/data/site";

/**
 * "Available for work" pill. Micro-interactions (CSS only): the lime dot
 * pulses; on hover / keyboard focus a lime fill wipes in left → right, the
 * label rolls up to "Let's talk" and the arrow slides in. Static under
 * reduced motion.
 */
export default function Availability({ className = "" }: { className?: string }) {
  const { label, hover, href } = site.availability;
  return (
    <a href={href} aria-label={`${label}, ${hover}`} className={`avail ${className}`}>
      <span aria-hidden="true" className="avail-fill" />
      <span aria-hidden="true" className="avail-dot" />
      <span aria-hidden="true" className="avail-text">
        <span className="avail-roll">
          <span>{label}</span>
          <span>
            {hover} <span className="avail-arrow">→</span>
          </span>
        </span>
      </span>
    </a>
  );
}
