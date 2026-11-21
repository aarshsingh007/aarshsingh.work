"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Section heading whose words rise out of masks the first time it scrolls into view. */
export default function RevealHeading({
  id,
  text,
  className = "",
}: {
  id: string;
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const show = useInView(ref, { once: true, amount: 0.6 });
  const words = text.split(" ");

  return (
    <h2 ref={ref} id={id} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "105%", opacity: 0 }}
              animate={show ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </h2>
  );
}
