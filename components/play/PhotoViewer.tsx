"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { PlayPhoto } from "@/data/play";
import { site } from "@/data/site";

const ASPECT = { portrait: 1.3, square: 1, landscape: 0.75 } as const;

/**
 * Enlarged photo dialog. Focus is trapped inside; Esc or a click on the
 * overlay closes it (focus returns to the item, handled by the caller);
 * Left/Right step through the photos.
 */
export default function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: PlayPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const reduce = !!useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const photo = photos[index];
  const n = index + 1;
  const { close, previous, next, dialogLabel } = site.play.viewer;

  const step = (d: number) => onIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "Tab") {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const btn =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-[13px] font-medium text-white focus-visible:outline-white";

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="play-tokens fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 px-4 py-6"
      style={{ background: "rgba(17,17,17,0.9)" }}
    >
      <button ref={closeRef} type="button" onClick={onClose} className={`${btn} absolute top-4 right-4`}>
        {close} ✕
      </button>

      <figure className="flex max-h-[80dvh] w-full max-w-[min(92vw,1000px)] flex-col items-center gap-3">
        {photo.src ? (
          <div className="relative h-[70dvh] w-full">
            <Image src={photo.src} alt={photo.alt} fill sizes="92vw" className="object-contain" />
          </div>
        ) : (
          <div
            role="img"
            aria-label={`${photo.alt} (placeholder)`}
            className="relative overflow-hidden rounded-[10px]"
            style={{
              background: `var(--cover-${photo.cover})`,
              width: `min(80vw, calc(68dvh / ${ASPECT[photo.aspect]}))`,
              aspectRatio: `1 / ${ASPECT[photo.aspect]}`,
            }}
          >
            <span className="absolute top-4 left-4 text-[14px] font-medium" style={{ color: "var(--cover-plum)" }}>
              {photo.alt}
            </span>
            <span
              aria-hidden="true"
              className="absolute -bottom-[0.18em] -left-[0.04em] font-sans text-[min(40vw,42dvh)] leading-none font-extrabold"
              style={{ color: "var(--cover-plum)" }}
            >
              {n}
            </span>
          </div>
        )}
        {(photo.caption || photo.tag) && (
          <figcaption className="text-center text-[15px] text-white">
            {photo.caption}
            {photo.tag && <span className="ml-2 opacity-75">{photo.tag}</span>}
          </figcaption>
        )}
      </figure>

      {photos.length > 1 && (
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => step(-1)} className={btn} aria-label={previous}>
            ←
          </button>
          <span className="text-[13px] text-white tabular-nums" aria-live="polite">
            {n} / {photos.length}
          </span>
          <button type="button" onClick={() => step(1)} className={btn} aria-label={next}>
            →
          </button>
        </div>
      )}
    </motion.div>,
    document.body
  );
}
