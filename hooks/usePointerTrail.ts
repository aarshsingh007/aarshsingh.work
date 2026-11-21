"use client";

import { useEffect, type RefObject } from "react";

/** The trail only runs inside this area: the landing hero (headline + card row). */
const AREA = ".hero-stage";

/** Elements inside that area the trail never spawns over (checked with closest()). */
const EXCLUDE = [
  "a",
  "button",
  "[role='button']",
  "input",
  "textarea",
  "select",
  "header",
  "nav",
  "[role='dialog']",
  ".hero-row", // hero card row
  ".pb-board",
  ".contact-row",
  "[data-no-trail]",
].join(",");

const SPACING = 110; // px of pointer travel per tile
const MAX_ALIVE = 6;
const LIFE = 1100; // ms: pop 180, hold, fade 700 → 1100
const POP = 180;
const FADE_FROM = 700;
const DRIFT = 28;

type Particle = {
  node: HTMLElement;
  born: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
};

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Spawns pooled tiles along the pointer path. One passive pointermove
 * listener, one rAF loop (stopped when nothing is alive), transforms and
 * opacity only. `onSpawn(node, index)` lets the caller set the tile's content.
 */
export function usePointerTrail(
  pool: RefObject<(HTMLElement | null)[]>,
  { enabled, onSpawn }: { enabled: boolean; onSpawn: (node: HTMLElement, index: number) => void }
) {
  useEffect(() => {
    if (!enabled) return;

    let lastX: number | null = null;
    let lastY = 0;
    let travelled = 0;
    let spawned = 0;
    let raf = 0;
    const alive: Particle[] = [];

    const hide = (p: Particle) => {
      p.node.style.opacity = "0";
      p.node.style.transform = "translate3d(-200px,-200px,0)";
    };

    const loop = (t: number) => {
      for (let i = alive.length - 1; i >= 0; i--) {
        const p = alive[i];
        const age = t - p.born;
        if (age >= LIFE) {
          hide(p);
          alive.splice(i, 1);
          continue;
        }
        const scale = 0.4 + 0.6 * easeOutBack(Math.min(1, age / POP));
        const d = DRIFT * easeOut(age / LIFE);
        const opacity = age < FADE_FROM ? 1 : 1 - (age - FADE_FROM) / (LIFE - FADE_FROM);
        p.node.style.opacity = String(Math.max(0, opacity));
        p.node.style.transform = `translate3d(${p.x + p.dx * d}px, ${p.y + p.dy * d}px, 0) translate(-50%, -50%) rotate(${p.rot}deg) scale(${scale})`;
      }
      raf = alive.length ? requestAnimationFrame(loop) : 0;
    };

    const clear = () => {
      alive.splice(0).forEach(hide);
      lastX = null;
      travelled = 0;
    };

    /* The headline mask zone: its box plus the overhang it declares. */
    const inPaddedZone = (x: number, y: number) => {
      const el = document.querySelector<HTMLElement>("[data-no-trail-pad]");
      if (!el) return false;
      const pad = Number(el.dataset.noTrailPad) || 0;
      const r = el.getBoundingClientRect();
      return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
    };

    const blocked = (e: PointerEvent) => {
      if (document.hidden) return true;
      if (e.buttons !== 0) return true; // dragging
      if (document.documentElement.dataset.preloader !== "done") return true; // preloader showing
      if (document.querySelector("[role='dialog'][aria-modal='true']")) return true; // open dialog
      const target = e.target;
      if (!(target instanceof Element) || !target.closest(AREA)) return true; // landing area only
      if (target.closest(EXCLUDE)) return true;
      return inPaddedZone(e.clientX, e.clientY);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (blocked(e)) {
        lastX = null;
        travelled = 0;
        return;
      }
      const { clientX: x, clientY: y } = e;
      if (lastX === null) {
        lastX = x;
        lastY = y;
        return;
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const step = Math.hypot(dx, dy);
      lastX = x;
      lastY = y;
      travelled += step;
      if (travelled < SPACING || step === 0) return;
      travelled = 0;

      const nodes = pool.current.filter(Boolean) as HTMLElement[];
      if (!nodes.length) return;
      if (alive.length >= MAX_ALIVE) hide(alive.shift()!);
      const node = nodes[spawned % nodes.length];
      // If the pooled node is still alive (pool > max alive, so rare), retire it first.
      const existing = alive.findIndex((p) => p.node === node);
      if (existing >= 0) alive.splice(existing, 1);

      onSpawn(node, spawned);
      spawned++;
      alive.push({
        node,
        born: performance.now(),
        x: x + (Math.random() * 2 - 1) * 14,
        y: y + (Math.random() * 2 - 1) * 14,
        dx: dx / step,
        dy: dy / step,
        rot: Math.random() * 24 - 12,
      });
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => document.hidden && clear();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
      clear();
    };
  }, [enabled, pool, onSpawn]);
}
