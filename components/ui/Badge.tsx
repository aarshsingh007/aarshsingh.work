"use client";

import { useId } from "react";

type Props = {
  text: string;
  /** Hide from assistive tech entirely (text duplicated elsewhere / ornamental). */
  decorative?: boolean;
  className?: string;
};

/*
 * Circular badge: lime disc, black text running around the edge, ✶ in the
 * centre. Rotation is CSS (.badge-spin) so it pauses on hover and stops
 * entirely under prefers-reduced-motion. Shared by the hero and About.
 */
export default function Badge({ text, decorative = false, className = "" }: Props) {
  const pathId = useId();
  const r = 37; // text baseline radius in a 100×100 box
  const circumference = 2 * Math.PI * r;

  return (
    <div
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": text.replace(/·/g, ",").replace(/,\s*$/, "") })}
      className={`badge ${className}`}
    >
      <div className="relative aspect-square w-full rounded-full bg-lime">
        <svg viewBox="0 0 100 100" className="badge-spin absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <path id={pathId} d={`M50,50 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`} />
          </defs>
          <text
            className="fill-ink font-sans"
            fontSize="8.4"
            fontWeight="600"
            textLength={circumference - 1}
            lengthAdjust="spacing"
          >
            <textPath href={`#${pathId}`}>{text}</textPath>
          </text>
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center text-ink"
          style={{ containerType: "inline-size" }}
        >
          <span className="text-[30cqw] leading-none">✶</span>
        </span>
      </div>
    </div>
  );
}
