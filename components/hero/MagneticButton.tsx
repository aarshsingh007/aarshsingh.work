"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";

type Props = {
  /** Renders a link… */
  href?: string;
  /** …or, without href, a <button> that calls this. */
  onClick?: () => void;
  /** Hide the trailing arrow (e.g. for action buttons). */
  noArrow?: boolean;
  children: React.ReactNode;
  cursorLabel?: string;
  /** 0–1: how far the button follows the pointer. */
  strength?: number;
  className?: string;
};

/**
 * Black button that fills lime (black text) on hover. Leans toward the
 * pointer on fine pointers when motion is allowed.
 */
export default function MagneticButton({
  href,
  onClick,
  noArrow = false,
  children,
  cursorLabel,
  strength = 0.3,
  className = "",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 });
  const innerX = useTransform(x, (v) => v * 0.3);
  const innerY = useTransform(y, (v) => v * 0.3);

  const onMove = (e: React.PointerEvent) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  const shared = {
    "data-cursor": cursorLabel,
    onPointerMove: onMove,
    onPointerLeave: reset,
    onBlur: reset,
    style: active ? { x, y } : undefined,
    className: `group relative inline-flex min-h-12 items-center overflow-hidden rounded-[4px] bg-ink px-6 text-[15px] font-medium text-bg transition-[color,scale] duration-300 hover:text-ink focus-visible:text-ink active:scale-[0.97] motion-reduce:active:scale-100 ${className}`,
  };
  const content = (
    <>
    {/* Lime fill rises on hover/focus (instant under reduced motion). */}
    <span
      aria-hidden="true"
      className="absolute inset-0 translate-y-full bg-lime transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transition-none"
    />
    <motion.span
      style={active ? { x: innerX, y: innerY } : undefined}
      className="relative inline-flex items-center gap-2"
    >
      {children}
      {/* Arrow leans forward on hover/focus. */}
      {!noArrow && (
      <span
        aria-hidden="true"
        className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
      >
        →
      </span>
      )}
    </motion.span>
    </>
  );

  return href !== undefined ? (
    <motion.a ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...shared}>
      {content}
    </motion.a>
  ) : (
    <motion.button ref={ref as React.Ref<HTMLButtonElement>} type="button" onClick={onClick} {...shared}>
      {content}
    </motion.button>
  );
}
