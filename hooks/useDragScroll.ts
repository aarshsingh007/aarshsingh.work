"use client";

import { useRef, type RefObject } from "react";

/**
 * Mouse drag-to-scroll + arrow-key stepping for a horizontal scroller.
 * After a drag it settles on the nearest card (centre- or start-aligned)
 * and swallows the click that would otherwise follow.
 */
export function useDragScroll(
  ref: RefObject<HTMLElement | null>,
  { cardSelector, align, reduce }: { cardSelector: string; align: "center" | "start"; reduce: boolean }
) {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const behavior: ScrollBehavior = reduce ? "auto" : "smooth";

  const cards = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(cardSelector) ?? []);

  /* Scroll position at which `el` is aligned. */
  const targetFor = (sc: HTMLElement, el: HTMLElement) => {
    if (align === "center") return el.offsetLeft + el.offsetWidth / 2 - sc.clientWidth / 2;
    const first = cards()[0];
    return el.offsetLeft - (first?.offsetLeft ?? 0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const sc = ref.current;
    if (!d || !sc) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true;
      sc.setPointerCapture(e.pointerId);
      sc.dataset.dragging = "true"; // disables snap while dragging
    }
    if (d.moved) sc.scrollLeft = d.left - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    const sc = ref.current;
    drag.current = null;
    if (!d?.moved || !sc) return;
    sc.releasePointerCapture?.(e.pointerId);
    delete sc.dataset.dragging;
    const list = cards();
    if (list.length) {
      const nearest = list.reduce((a, b) =>
        Math.abs(targetFor(sc, b) - sc.scrollLeft) < Math.abs(targetFor(sc, a) - sc.scrollLeft) ? b : a
      );
      sc.scrollTo({ left: targetFor(sc, nearest), behavior });
    }
    // Swallow the click that follows a drag.
    sc.addEventListener("click", (ev) => ev.preventDefault(), { capture: true, once: true });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const sc = ref.current;
    if (!sc || (e.key !== "ArrowLeft" && e.key !== "ArrowRight") || e.target !== sc) return;
    e.preventDefault();
    const [a, b] = cards();
    const step = a && b ? b.offsetLeft - a.offsetLeft : (a?.offsetWidth ?? 240);
    sc.scrollBy({ left: e.key === "ArrowRight" ? step : -step, behavior });
  };

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onKeyDown };
}
