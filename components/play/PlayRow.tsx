"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { Project } from "@/data/projects";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useFinePointer } from "@/hooks/useFinePointer";
import { HelloCard, PlayCard } from "./PlayCard";

export type RowItem =
  | { key: "hello"; kind: "hello" }
  | { key: string; kind: "project"; project: Project };

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Horizontal arc of cards. Native scroll + snap; each card's tilt and drop
 * come from its distance to the viewport centre, computed in a rAF scroll
 * handler and written to CSS variables (no React state per frame).
 */
export default function PlayRow({
  items,
  label,
  show,
}: {
  items: RowItem[];
  label: string;
  /** Drive the fan-up entrance externally (e.g. after the intro); default: when 30% in view. */
  show?: boolean;
}) {
  const fine = useFinePointer();
  const reduce = !!useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const seen = useInView(scroller, { once: true, amount: 0.3 });
  const inView = show ?? seen;
  const center = items.findIndex((it) => it.kind === "hello");

  /* ---------- arc: rotation + vertical offset from distance to centre ---------- */
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    let raf = 0;
    /*
     * n = (card centre − viewport centre) / 1.12W
     * rotation = 6° · n   (capped at 5° on touch / narrow screens)
     * drop     = W · (0.045·|n| + 0.02·n²)
     */
    const update = () => {
      raf = 0;
      const cards = sc.querySelectorAll<HTMLElement>("[data-play-card]");
      const W = cards[0]?.offsetWidth ?? 0;
      if (!W) return;
      const vw = window.innerWidth;
      const cx = vw / 2;
      const cap = !fine || vw < 768 ? 5 : Infinity;
      cards.forEach((el) => {
        const r = el.getBoundingClientRect();
        const n = reduce ? 0 : (r.left + r.width / 2 - cx) / (1.12 * W);
        const rot = Math.max(-cap, Math.min(cap, 6 * n));
        const ty = W * (0.045 * Math.abs(n) + 0.02 * n * n);
        el.style.setProperty("--rot", `${rot.toFixed(2)}deg`);
        el.style.setProperty("--ty", `${ty.toFixed(1)}px`);
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    sc.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Re-run while layout animations move cards around.
    const ro = new ResizeObserver(schedule);
    ro.observe(sc);
    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [fine, reduce, items]);

  /* ---------- start with the Hello card centred ---------- */
  useLayoutEffect(() => {
    const sc = scroller.current;
    const hello = sc?.querySelector<HTMLElement>('[data-play-card="hello"]');
    if (!sc || !hello) return;
    sc.scrollLeft = hello.offsetLeft + hello.offsetWidth / 2 - sc.clientWidth / 2;
  }, []);

  // No mouse drag-to-scroll here (trackpad, touch and arrow keys still scroll); keep the arrow-key stepping.
  const { onKeyDown } = useDragScroll(scroller, { cardSelector: "[data-play-card]", align: "center", reduce });

  return (
    <div
      ref={scroller}
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="play-scroller no-scrollbar overflow-x-auto overflow-y-hidden focus-visible:outline-offset-[-3px]"
    >
      {/* Centre-to-centre 1.12W; side padding lets the first/last card reach the centre. */}
      <ul className="flex w-max gap-[calc(var(--w)*0.12)] px-[calc(50vw-var(--w)/2)] pt-[calc(var(--w)*0.08)] pb-[calc(var(--w)*0.32)]">
        {items.map((item, i) => (
          <motion.li
            key={item.key}
            data-play-card={item.kind === "hello" ? "hello" : item.key}
            initial={reduce ? false : { opacity: 0, y: "8vh" }}
            animate={inView || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: "8vh" }}
            transition={{
              opacity: { duration: 0.6, ease: "easeOut", delay: Math.abs(i - center) * 0.07 },
              y: { duration: 0.9, ease: EASE, delay: Math.abs(i - center) * 0.07 },
            }}
            className="play-li relative w-(--w) shrink-0 snap-center"
          >
            {/* Arc layer (scroll-driven); cards stay put on hover. */}
            <div className="play-arc">
              {item.kind === "hello" ? <HelloCard /> : <PlayCard project={item.project} />}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
