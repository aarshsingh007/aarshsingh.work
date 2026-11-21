"use client";

import {
  motion,
  useAnimate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import Badge from "@/components/ui/Badge";
import { site } from "@/data/site";
import { useFinePointer } from "@/hooks/useFinePointer";

const EASE = [0.22, 1, 0.36, 1] as const;
const WIPE = [0.65, 0, 0.35, 1] as const;

/* Choreography (seconds after the section enters view). */
const T = {
  word: 0.1,
  wordStep: 0.08,
  highlight: 0.55,
  para: 0.5,
  paraStep: 0.12,
  portrait: 0.15,
  portraitDur: 1.1,
  badge: 1.05,
};

/* A word that slides up out of a mask. */
function MaskWord({
  children,
  show,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  show: boolean;
  delay: number;
  className?: string;
}) {
  return (
    <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
      <motion.span
        className={`inline-block ${className}`}
        initial={{ y: "105%", opacity: 0 }}
        animate={show ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function Heading({ show }: { show: boolean }) {
  const { heading, highlight } = site.about;
  const at = heading.indexOf(highlight);
  const before = heading.slice(0, at).trim().split(/\s+/);
  const after = heading.slice(at + highlight.length);
  const hlDelay = T.word + before.length * T.wordStep;

  return (
    <h2
      id="about-title"
      className="font-serif text-[clamp(3.25rem,8vw,8rem)] leading-[0.95] font-normal tracking-[-0.02em]"
    >
      {before.map((w, i) => (
        <span key={i}>
          <MaskWord show={show} delay={T.word + i * T.wordStep}>
            {w}
          </MaskWord>{" "}
        </span>
      ))}
      <MaskWord show={show} delay={hlDelay}>
        <span className="relative isolate inline-block pr-[0.02em] italic">
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: show ? 1 : 0 }}
            transition={{ duration: 0.6, ease: WIPE, delay: T.highlight }}
            className="absolute inset-x-[-0.06em] top-[42%] bottom-[10%] -z-10 origin-left bg-lime"
          />
          {highlight}
        </span>
        {after}
      </MaskWord>
    </h2>
  );
}

/** Signature image, revealed left → right like a pen stroke (a fade under reduced motion). */
function Signature({ show }: { show: boolean }) {
  const { signature } = site.about;
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  /* Hover re-writes it, left → right (fine pointers, motion allowed). */
  const replay = () => {
    if (!fine || reduce || !show || !scope.current) return;
    animate(scope.current, { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"] }, { duration: 0.9, ease: "easeInOut" });
  };
  if (!signature) return null;
  return (
    <motion.div
      ref={scope}
      onPointerEnter={replay}
      aria-hidden="true"
      initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0)" }}
      animate={
        reduce ? { opacity: show ? 1 : 0 } : { clipPath: show ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }
      }
      transition={{ duration: reduce ? 0.5 : 1.4, ease: "easeInOut", delay: 0.9 }}
      className="w-fit"
    >
      <Image
        src={signature.src}
        alt=""
        width={signature.width}
        height={signature.height}
        className="h-16 w-auto sm:h-20"
      />
    </motion.div>
  );
}

/**
 * Body copy that "inks in" word by word as it scrolls through the viewport
 * (faint → full), and the emphasis phrase gets a lime marker once it's all
 * read. One CSS variable (--p) per frame; no React state. Under reduced
 * motion the text is simply full strength with the marker drawn.
 */
function InkParagraphs({ paragraphs }: { paragraphs: readonly string[] }) {
  const { emphasis } = site.about;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 60%"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!reduce) ref.current?.style.setProperty("--p", v.toFixed(4));
  });

  let n = 0;
  const words = paragraphs.map((p) => p.split(" "));
  const total = words.reduce((a, w) => a + w.length, 0);

  return (
    <div
      ref={ref}
      className="ink-copy mt-8 max-w-[60ch] space-y-5 text-[17px] leading-[1.65] sm:text-[18px]"
      style={{ "--n": total, ...(reduce ? { "--p": 1 } : {}) } as React.CSSProperties}
    >
      {paragraphs.map((p, pi) => {
        const at = emphasis ? p.indexOf(emphasis) : -1;
        const renderWords = (text: string) =>
          text
            .split(" ")
            .filter(Boolean)
            .map((w, wi) => (
              <span key={`${pi}-${n}-${wi}`} className="ink-word" style={{ "--i": n++ } as React.CSSProperties}>
                {w}{" "}
              </span>
            ));
        if (at < 0) return <p key={pi}>{renderWords(p)}</p>;
        return (
          <p key={pi}>
            {renderWords(p.slice(0, at))}
            <span className="ink-mark">{renderWords(emphasis!)}</span>
            {renderWords(p.slice(at + emphasis!.length))}
          </p>
        );
      })}
    </div>
  );
}

function Portrait({ show }: { show: boolean }) {
  const { photo, badge } = site.about;
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);

  /* Gentle scroll parallax — fine pointers only, ±12px. */
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [12, -12]);
  const parallax = fine && !reduce;

  /* Pointer tilt: the frame and badge lean ≤4° toward the pointer on a soft spring. */
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 18 });
  const onTilt = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!parallax || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const resetTilt = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onTilt}
      onPointerLeave={resetTilt}
      style={parallax ? { rotateX, rotateY, transformPerspective: 1200 } : undefined}
      className="relative"
    >
      {/* Portrait: wipes in bottom→top (plain fade under reduced motion). */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)" }}
        animate={
          show
            ? reduce
              ? { opacity: 1 }
              : { clipPath: "inset(0% 0% 0% 0%)" }
            : reduce
              ? { opacity: 0 }
              : { clipPath: "inset(100% 0% 0% 0%)" }
        }
        transition={{ duration: reduce ? 0.5 : T.portraitDur, ease: WIPE, delay: T.portrait }}
        className="relative aspect-[4/5] overflow-hidden rounded-[4px]"
      >
        <motion.div style={parallax ? { y, scale: 1.04 } : undefined} className="absolute inset-0">
          {photo ? (
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
              style={photo.position ? { objectPosition: photo.position } : undefined}
            />
          ) : (
            <div
              role="img"
              aria-label="Portrait photo coming soon"
              className="group flex size-full flex-col justify-between bg-lime p-[6%] text-ink"
            >
              <span aria-hidden="true" className="self-end text-[12px] font-medium tracking-[0.08em] uppercase">
                Photo coming soon
              </span>
              <span
                aria-hidden="true"
                className="inline-block origin-bottom-left self-start font-serif text-[clamp(7rem,22vw,16rem)] leading-[0.8] italic transition-transform duration-500 ease-out group-hover:-rotate-6 motion-reduce:transition-none"
              >
                A.
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Badge overlaps the top-left corner, slightly off the edge. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: T.badge }}
        className="absolute -top-6 -left-3 z-10 w-24 sm:-top-10 sm:-left-10 sm:w-32 lg:w-36"
      >
        <Badge text={badge} decorative className="rounded-full ring-1 ring-ink" />
      </motion.div>
    </motion.div>
  );
}

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const show = useInView(ref, { once: true, amount: 0.25 });
  const { paragraphs, meta } = site.about;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    transition: { duration: 0.7, ease: EASE, delay },
  });

  return (
    <section
      ref={ref}
      id="about"
      aria-labelledby="about-title"
      className="border-t border-ink/10 px-(--gutter) py-(--section-y)"
    >
      <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-8">
        {/* Portrait first on mobile; right column (offset down) on desktop. */}
        <div className="px-3 pt-6 sm:px-10 sm:pt-10 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:mt-12 lg:px-0 lg:pt-0">
          <Portrait show={show} />
        </div>

        <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:self-center">
          <Heading show={show} />

          <motion.div {...fadeUp(T.para)}>
            <InkParagraphs paragraphs={paragraphs} />
          </motion.div>

          {meta && (
            <motion.p {...fadeUp(T.para + paragraphs.length * T.paraStep)} className="mt-6 text-[13px]">
              {meta}
            </motion.p>
          )}

          <motion.div {...fadeUp(T.para + (paragraphs.length + 1) * T.paraStep)} className="mt-10">
            <Signature show={show} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
