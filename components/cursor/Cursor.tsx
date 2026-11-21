"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useIntroReady } from "@/components/IntroProvider";
import { useFinePointer } from "@/hooks/useFinePointer";

type Theme = "light" | "dark" | "contact";
/** What the nearest cursor attribute asks for. */
type Mode = "default" | "label" | "big" | "dot" | "hide";

/* Nearest of these wins (closest()). */
const MODE_SELECTOR = "[data-cursor],[data-cursor-big],[data-cursor-dot],[data-cursor-hide]";

const CONTACT_EASE = { duration: 0.25, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * Small dot that grows into a lime circle labelled from data-cursor.
 *  - data-cursor-tone="ink" makes the labelled circle ink with a lime label.
 *  - [data-cursor-hide] hides it, [data-cursor-dot] keeps it a 12px dot,
 *    [data-cursor-big] grows it to 120px with no label.
 *  - data-cursor-theme="dark" → white dot; "contact" → lime, soft spring,
 *    0.25s scale in/out.
 * Fine pointers only, from the end of the intro. Under reduced motion it is
 * off everywhere except Contact, where it is a plain 12px dot (no spring/scale).
 * Position is written through motion values — no React render per move.
 */
export default function Cursor() {
  const ready = useIntroReady();
  const fine = useFinePointer();
  const reduce = !!useReducedMotion();
  const active = ready && fine;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 40, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 600, damping: 40, mass: 0.35 });
  /* Softer follow inside Contact. */
  const softX = useSpring(x, { stiffness: 170, damping: 22, mass: 0.6 });
  const softY = useSpring(y, { stiffness: 170, damping: 22, mass: 0.6 });

  const [mode, setMode] = useState<Mode>("default");
  const [label, setLabel] = useState<string | null>(null);
  /* data-cursor-tone="ink": ink circle, lime label (for lime backgrounds). */
  const [ink, setInk] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const contact = theme === "contact";
  /* Reduced motion: the custom cursor exists only inside Contact. */
  const shown = !reduce || contact;

  useEffect(() => {
    if (!active) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest<HTMLElement>(MODE_SELECTOR);
      const themeEl = target?.closest<HTMLElement>("[data-cursor-theme]");
      const t = themeEl?.dataset.cursorTheme;
      setTheme(t === "dark" || t === "contact" ? t : "light");
      if (!el) {
        setMode("default");
        setLabel(null);
      } else if (el.hasAttribute("data-cursor-hide")) setMode("hide");
      else if (el.hasAttribute("data-cursor-dot")) setMode("dot");
      else if (el.hasAttribute("data-cursor-big")) setMode("big");
      else if (el.dataset.cursor) {
        setMode("label");
        setLabel(el.dataset.cursor);
        setInk(!!el.closest('[data-cursor-tone="ink"]'));
      } else setMode("default");
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) setVisible(false);
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, [active, x, y]);

  /* Hide the native cursor only while ours is showing. */
  useEffect(() => {
    if (!active || !shown) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    return () => root.classList.remove("has-custom-cursor");
  }, [active, shown]);

  if (!active || !shown) return null;

  /* Reduced motion (Contact only): plain 12px lime dot, no labels or sizes. */
  const m: Mode = reduce ? (mode === "hide" ? "hide" : "dot") : mode;
  const withLabel = m === "label" && !!label;
  const size = withLabel ? 72 : m === "big" ? 120 : m === "dot" || contact ? 12 : 10;
  /* Contact's "empty area" state is the lime "Say hi" circle via the section's data-cursor. */
  const lime = withLabel || m === "big" || contact;
  const inkLabel = withLabel && ink;
  const fill = inkLabel ? "bg-ink" : lime ? "bg-lime" : theme === "dark" ? "bg-white" : "bg-ink";
  const ring = inkLabel ? "ring-1 ring-lime" : withLabel && !contact ? "ring-1 ring-ink" : "";
  const transition = reduce
    ? { duration: 0 }
    : contact
      ? CONTACT_EASE
      : ({ type: "spring", stiffness: 400, damping: 30 } as const);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      style={reduce ? { x, y } : contact ? { x: softX, y: softY } : { x: sx, y: sy }}
    >
      <motion.div
        className={`grid -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full ${fill} ${ring}`}
        initial={false}
        animate={{
          width: size,
          height: size,
          opacity: visible && m !== "hide" ? 1 : 0,
          scale: reduce ? 1 : m === "hide" ? 0 : pressed ? 0.8 : 1,
        }}
        transition={transition}
      >
        {/* Old and new labels share one grid cell while they cross-fade, so the text never jumps. */}
        <AnimatePresence initial={false}>
          {withLabel && (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className={`[grid-area:1/1] font-sans text-[12px] font-medium whitespace-nowrap ${inkLabel ? "text-lime" : "text-ink"}`}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
