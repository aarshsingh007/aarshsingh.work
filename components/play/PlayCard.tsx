"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { Project } from "@/data/projects";
import { site } from "@/data/site";
import CardFace from "./CardFace";

/** Hero-strip card: display only — no link, no cursor label, no hover motion. */
export function PlayCard({ project }: { project: Project }) {
  return <CardFace project={project} sizes="(min-width: 768px) 20vw, 62vw" />;
}

/**
 * Centre card (always peach): your photo. Tap / click / Enter flips it to a
 * childhood photo and back.
 *
 * Micro-interactions: a 3D flip on a soft spring; on hover the photo leans
 * toward you a few degrees and a folded corner grows (fine pointers); a
 * "Now" / "Then" chip rolls with the flip; a gentle press on tap.
 * Reduced motion: an instant crossfade, no tilt.
 */
export function HelloCard() {
  const { label, category, now, then, flipToThen, flipToNow } = site.play.hello;
  const reduce = !!useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  const face = (photo: { src: string; alt: string; position: string }, visible: boolean, back: boolean) => (
    <div
      className={`hello-face ${back ? "hello-face-back" : ""}`}
      style={reduce ? { opacity: visible ? 1 : 0 } : undefined}
      aria-hidden={!visible}
    >
      <Image
        src={photo.src}
        alt={visible ? photo.alt : ""}
        fill
        sizes="(min-width: 768px) 20vw, 62vw"
        className="object-cover"
        style={{ objectPosition: photo.position }}
        draggable={false}
      />
    </div>
  );

  return (
    <div className="play-card" style={{ background: "var(--frame-peach)" }}>
      <motion.button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={flipped ? flipToNow : flipToThen}
        data-cursor="Flip"
        whileTap={reduce ? undefined : { scale: 0.97 }}
        className="play-media hello-flip group"
      >
        <motion.div
          className="hello-flip-inner"
          initial={false}
          animate={reduce ? undefined : flipped ? "back" : "front"}
          whileHover={reduce ? undefined : flipped ? "backHover" : "frontHover"}
          variants={{
            front: { rotateY: 0 },
            back: { rotateY: 180 },
            frontHover: { rotateY: -9 },
            backHover: { rotateY: 189 },
          }}
          transition={{ type: "spring", stiffness: 150, damping: 17, mass: 0.9 }}
        >
          {face(now, !flipped, false)}
          {face(then, flipped, true)}
        </motion.div>

        {/* "Now" / "Then" chip rolls with the flip. */}
        <span aria-hidden="true" className="hello-chip">
          <span className="hello-chip-roll" style={{ translate: flipped ? "0 -50%" : "0 0" }}>
            <span>{now.label}</span>
            <span>{then.label}</span>
          </span>
        </span>

        {/* Folded corner — grows on hover as a "flip me" hint. */}
        <span aria-hidden="true" className="hello-peel" />
      </motion.button>

      <p className="play-title">{label}</p>
      <p className="play-cat">{category}</p>
    </div>
  );
}
