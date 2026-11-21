"use client";

import { useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useRef } from "react";
import { SHOW_LABELS, tools } from "@/data/tools";
import { useFinePointer } from "@/hooks/useFinePointer";
import { usePointerTrail } from "@/hooks/usePointerTrail";

const POOL = 8;
const LOOKS = 3; // lime · ink · white (alternating by spawn index)

/**
 * Decorative trail of tool tiles that follows the pointer within the landing
 * page. Fine pointers only, off under reduced motion, aria-hidden throughout.
 * A pool of 8 tiles is reused; each tile pre-renders every tool and shows one.
 */
export default function ToolTrail() {
  const pathname = usePathname();
  const fine = useFinePointer();
  const reduce = !!useReducedMotion();
  const enabled = pathname === "/" && fine && !reduce;
  const pool = useRef<(HTMLElement | null)[]>([]);

  const onSpawn = useCallback((node: HTMLElement, index: number) => {
    const tool = tools[index % tools.length];
    node.dataset.look = String(index % LOOKS);
    node.querySelectorAll<HTMLElement>("[data-tool]").forEach((el) => {
      el.hidden = el.dataset.tool !== tool.id;
    });
  }, []);

  usePointerTrail(pool, { enabled, onSpawn });

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="tool-trail">
      {Array.from({ length: POOL }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            pool.current[i] = el;
          }}
          className="tool-trail-tile"
          data-look="0"
        >
          {tools.map((tool) => (
            <div key={tool.id} data-tool={tool.id} hidden className="tool-trail-face">
              <span className="tool-trail-box">
                {tool.icon === "simple" ? (
                  <svg viewBox="0 0 24 24" className="tool-trail-glyph" fill="currentColor">
                    <path d={tool.mark} />
                  </svg>
                ) : (
                  <span className="tool-trail-mono">{tool.mark}</span>
                )}
              </span>
              {SHOW_LABELS && <span className="tool-trail-label">{tool.name}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
