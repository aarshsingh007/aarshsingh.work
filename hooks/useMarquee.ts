"use client";

import { useEffect, useRef, type RefObject } from "react";

type Options = {
  /** px per second at full speed. */
  speed: number;
  /** ms to wait after hover / focus / drag ends before easing back up. */
  resumeDelay: number;
  /** Paused by the Pause/Play button (or reduced motion). */
  paused: boolean;
  /** Card selector; the first card of the clone set carries [data-loop-start]. */
  card: string;
};

const STOP_TAU = 250 / 3; // ≈ 250ms to a stop
const START_TAU = 200 / 3; // ≈ 200ms back to full speed
const DRAG_SLOP = 5; // px before a press counts as a drag (and swallows the click)

/**
 * Seamless infinite marquee: `track` holds the item list twice and moves left
 * via translateX written in a rAF loop (no React state per frame).
 *
 * - The offset advances on a running clock: while the viewport is off-screen
 *   only the rAF work stops, and on return the offset jumps to where the
 *   clock says it should be (already mid-motion, no restart).
 * - Hover / keyboard focus on a card eases it to a stop; leaving waits
 *   `resumeDelay`, then eases back to full speed.
 * - Pointer drag (mouse, or horizontal touch swipe with touch-action: pan-y)
 *   moves the row directly.
 * - One set's width is measured at rest (ResizeObserver, cached) so a card
 *   expanding on hover never shifts the loop maths.
 */
export function useMarquee(
  viewport: RefObject<HTMLElement | null>,
  track: RefObject<HTMLElement | null>,
  { speed, resumeDelay, paused, card }: Options
) {
  const pausedRef = useRef(paused);
  /* Live hook into the running loop so the button applies at once. */
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    wake.current();
  }, [paused]);

  useEffect(() => {
    const vp = viewport.current;
    const tr = track.current;
    if (!vp || !tr) return;

    let pos = 0; // px travelled left, wrapped to [0, setWidth)
    let vel = pausedRef.current ? 0 : 1; // 0..1 of full speed
    let last = performance.now();
    let raf = 0;
    let visible = false;
    let setWidth = 0;
    let hovered = false;
    let focused = false;
    let resumeAt = 0;
    let lastRelease = 0;
    let drag: { id: number; x: number; moved: number } | null = null;
    let remeasure = 0;

    const wrap = () => {
      if (setWidth > 0) pos = ((pos % setWidth) + setWidth) % setWidth;
    };
    const paint = () => {
      tr.style.transform = `translate3d(${-pos}px, 0, 0)`;
    };
    const engaged = () => hovered || focused || !!drag;
    const target = (t: number) => (pausedRef.current || engaged() || t < resumeAt ? 0 : 1);

    /* Width of one set = start of the clone set − start of the first card, measured at rest. */
    const measure = () => {
      const anyExpanded = engaged() || performance.now() - lastRelease < 700;
      if (anyExpanded) return; // a widened card would skew it; keep the cached value
      const first = tr.querySelector<HTMLElement>(card);
      const loopStart = tr.querySelector<HTMLElement>("[data-loop-start]");
      if (first && loopStart) {
        const w = loopStart.offsetLeft - first.offsetLeft;
        if (w > 0) setWidth = w;
        wrap();
        paint();
      }
    };

    const step = (t: number) => {
      const dt = Math.max(0, t - last);
      last = t;
      const goal = target(t);
      const tau = goal > vel ? START_TAU : STOP_TAU;
      vel += (goal - vel) * (1 - Math.exp(-dt / tau));
      if (Math.abs(goal - vel) < 0.001) vel = goal;
      if (!drag) pos += (speed * vel * dt) / 1000;
      wrap();
      paint();
    };

    const loop = (t: number) => {
      step(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || !visible) return;
      /* Clock-derived catch-up: cover the time spent off-screen at the current speed. */
      const now = performance.now();
      if (!drag) pos += (speed * vel * (now - last)) / 1000;
      last = now;
      wrap();
      paint();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    wake.current = () => {
      if (visible && !raf) start();
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop(); // `last` keeps the time it went off-screen
    });
    io.observe(vp);

    const ro = new ResizeObserver(measure);
    ro.observe(tr);
    measure();

    const release = () => {
      lastRelease = performance.now();
      resumeAt = lastRelease + resumeDelay;
      window.clearTimeout(remeasure);
      remeasure = window.setTimeout(measure, 720); // once the card has shrunk back
    };

    /* Hover on a card (not the gaps' edges of the viewport). */
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const on = !!(e.target as Element).closest(card);
      if (on !== hovered) {
        hovered = on;
        if (!on) release();
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && hovered) {
        hovered = false;
        release();
      }
    };

    /* Keyboard focus: stop, and bring the focused card fully into view. */
    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as Element).closest<HTMLElement>(card);
      if (!el) return;
      focused = true;
      const v = vp.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const pad = 24;
      const width = el.offsetWidth * 1.8; // room for the hover/focus expansion
      if (r.left < v.left + pad) pos -= v.left + pad - r.left;
      else if (r.left + width > v.right - pad) pos += Math.min(r.left - v.left - pad, r.left + width - (v.right - pad));
      wrap();
      paint();
      vp.scrollLeft = 0; // focus() may have scrolled the clipped viewport
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!vp.contains(e.relatedTarget as Node | null)) {
        focused = false;
        release();
      }
    };

    /* Drag: the row follows the pointer 1:1. */
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      drag = { id: e.pointerId, x: e.clientX, moved: 0 };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.moved += Math.abs(dx);
      if (drag.moved > DRAG_SLOP && !vp.dataset.dragging) {
        vp.dataset.dragging = "";
        try {
          vp.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already gone — keep dragging without capture */
        }
      }
      if (vp.dataset.dragging !== undefined) {
        pos -= dx;
        vel = 0;
        wrap();
        paint();
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasDrag = drag.moved > DRAG_SLOP;
      drag = null;
      delete vp.dataset.dragging;
      if (vp.hasPointerCapture(e.pointerId)) vp.releasePointerCapture(e.pointerId);
      release();
      if (wasDrag) {
        // Swallow the click that ends a drag so a card link doesn't open.
        const block = (c: MouseEvent) => {
          c.preventDefault();
          c.stopPropagation();
        };
        vp.addEventListener("click", block, { capture: true, once: true });
        window.setTimeout(() => vp.removeEventListener("click", block, { capture: true }), 0);
      }
    };
    const noNativeDrag = (e: DragEvent) => e.preventDefault();

    vp.addEventListener("pointerover", onOver);
    vp.addEventListener("pointerleave", onLeave);
    vp.addEventListener("focusin", onFocusIn);
    vp.addEventListener("focusout", onFocusOut);
    vp.addEventListener("pointerdown", onDown);
    vp.addEventListener("pointermove", onMove);
    vp.addEventListener("pointerup", onUp);
    vp.addEventListener("pointercancel", onUp);
    vp.addEventListener("dragstart", noNativeDrag);

    return () => {
      stop();
      window.clearTimeout(remeasure);
      io.disconnect();
      ro.disconnect();
      wake.current = () => {};
      vp.removeEventListener("pointerover", onOver);
      vp.removeEventListener("pointerleave", onLeave);
      vp.removeEventListener("focusin", onFocusIn);
      vp.removeEventListener("focusout", onFocusOut);
      vp.removeEventListener("pointerdown", onDown);
      vp.removeEventListener("pointermove", onMove);
      vp.removeEventListener("pointerup", onUp);
      vp.removeEventListener("pointercancel", onUp);
      vp.removeEventListener("dragstart", noNativeDrag);
      delete vp.dataset.dragging;
      tr.style.transform = "";
    };
  }, [viewport, track, speed, resumeDelay, card]);
}
