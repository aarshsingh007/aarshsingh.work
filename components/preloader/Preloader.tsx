"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { GREETINGS } from "./greetings";
import styles from "./Preloader.module.css";

/** sessionStorage key — the preloader plays once per browser session. */
export const PRELOADER_STORAGE_KEY = "as:preloader-seen";
/** Fired on window once the homepage has been revealed. */
export const PRELOADER_COMPLETE_EVENT = "preloader:complete";

type Phase = "greetings" | "welcome" | "exit" | "done";

type PreloaderProps = {
  /** id of the page content wrapper; it is made inert while the intro plays. */
  contentId?: string;
  /** ms the closing welcome message stays on screen. */
  welcomeHold?: number;
  onComplete?: () => void;
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
const EXIT_DURATION = 1.05; // seconds — clip-path wipe
const TOTAL_GREETINGS = GREETINGS.length;
const pad = (n: number) => String(n).padStart(2, "0");

/*
 * Slot-style roll: outgoing and incoming words share one duration and one
 * easing curve, so they travel in lockstep instead of colliding.
 */
const EASE_ROLL = [0.65, 0, 0.35, 1] as const;
const wordTransition: Transition = { duration: 0.58, ease: EASE_ROLL };

/*
 * Decided once per page load (not per effect run) so React Strict Mode's
 * double-invoked effects can't read the flag they just wrote.
 */
let shouldPlayThisLoad: boolean | null = null;
function shouldPlay(): boolean {
  if (shouldPlayThisLoad !== null) return shouldPlayThisLoad;
  let seen = false;
  try {
    seen = sessionStorage.getItem(PRELOADER_STORAGE_KEY) === "1";
    sessionStorage.setItem(PRELOADER_STORAGE_KEY, "1");
  } catch {
    /* storage blocked — just play it */
  }
  shouldPlayThisLoad = !seen;
  return shouldPlayThisLoad;
}

export default function Preloader({
  contentId = "site-content",
  welcomeHold = 1900,
  onComplete,
}: PreloaderProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("greetings");
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const finished = useRef(false);

  /* ---------- finish: reveal the site, unlock, notify ---------- */
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setPhase("done");
    const root = document.documentElement;
    root.dataset.preloader = "done";
    root.style.removeProperty("overflow");
    document.getElementById(contentId)?.removeAttribute("inert");
    window.dispatchEvent(new CustomEvent(PRELOADER_COMPLETE_EVENT));
    onComplete?.();
  }, [contentId, onComplete]);

  const skip = useCallback(() => {
    setPhase((p) => (p === "done" || p === "exit" ? p : "exit"));
  }, []);

  /* ---------- mount: session check, lock, fail-safes ---------- */
  useEffect(() => {
    setHydrated(true);
    if (!shouldPlay()) {
      // Repeat visit: skip straight to "done" but still notify listeners
      // so the page's entrance animation runs.
      finish();
      return;
    }

    const root = document.documentElement;
    root.dataset.preloader = "active";
    root.style.overflow = "hidden";
    document.getElementById(contentId)?.setAttribute("inert", "");

    // Warm only the glyphs needed for the non-Latin scripts.
    if (document.fonts?.load) {
      const css = getComputedStyle(root);
      GREETINGS.forEach((g) => {
        const match = g.font.match(/var\((--[\w-]+)\)/);
        const family = match ? css.getPropertyValue(match[1]).trim() : "";
        if (family) document.fonts.load(`400 64px ${family}`, g.word).catch(() => {});
      });
    }

    // Hard ceiling: the site is never held hostage by the animation
    // (throttled background tabs, dropped frames, unexpected errors).
    const total =
      GREETINGS.reduce((sum, g) => sum + g.hold, 0) + welcomeHold + EXIT_DURATION * 1000;
    const ceiling = window.setTimeout(finish, total + 2500);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(ceiling);
      window.removeEventListener("keydown", onKey);
    };
  }, [contentId, finish, skip, welcomeHold]);

  /* ---------- reduced motion: go straight to the welcome line ---------- */
  useEffect(() => {
    if (reduceMotion && phase === "greetings") setPhase("welcome");
  }, [reduceMotion, phase]);

  /* ---------- sequencer ---------- */
  useEffect(() => {
    if (!hydrated || finished.current) return;
    let t: number | undefined;
    if (phase === "greetings" && !reduceMotion) {
      t = window.setTimeout(() => {
        if (index < TOTAL_GREETINGS - 1) setIndex((i) => i + 1);
        else setPhase("welcome");
      }, GREETINGS[index].hold);
    } else if (phase === "welcome") {
      t = window.setTimeout(() => setPhase("exit"), reduceMotion ? 1400 : welcomeHold);
    } else if (phase === "exit") {
      // Timer-driven (not animation-callback-driven) so a throttled or
      // interrupted animation can never leave the overlay stuck.
      t = window.setTimeout(finish, reduceMotion ? 550 : (EXIT_DURATION + 0.12) * 1000 + 80);
    }
    return () => window.clearTimeout(t);
  }, [hydrated, phase, index, reduceMotion, welcomeHold, finish]);

  if (phase === "done") return null;

  const current = GREETINGS[index];
  const step = phase === "greetings" ? index + 1 : TOTAL_GREETINGS;
  const exiting = phase === "exit";

  /* Exit: the paper panel wipes upward, a lime band trails it, then the site. */
  const panelExit = reduceMotion
    ? { opacity: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
    : { clipPath: "inset(0% 0% 100% 0%)", transition: { duration: EXIT_DURATION, ease: EASE_IN_OUT } };
  const bandExit = reduceMotion
    ? { opacity: 0, transition: { duration: 0.5 } }
    : {
        clipPath: "inset(0% 0% 100% 0%)",
        transition: { duration: EXIT_DURATION, ease: EASE_IN_OUT, delay: 0.12 },
      };

  return (
    <div
      className={styles.root}
      data-preloader-root
      data-hydrated={hydrated || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Intro: a world of hello"
    >
      <motion.div
        className={styles.band}
        aria-hidden="true"
        initial={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
        animate={exiting ? bandExit : undefined}
      />

      <motion.div
        className={styles.panel}
        initial={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
        animate={exiting ? panelExit : undefined}
      >
        <motion.div
          className={styles.inner}
          animate={exiting && !reduceMotion ? { y: "-8vh", opacity: 0 } : undefined}
          transition={{ duration: EXIT_DURATION * 0.8, ease: EASE_IN_OUT }}
        >
          {/* ---------- top bar ---------- */}
          <header className={styles.topbar}>
            <span className={styles.brand}>
              Aarsh Singh<sup>®</sup>
            </span>
            <span className={styles.meta}>Portfolio — 2026</span>
          </header>

          {/* ---------- stage ---------- */}
          <div className={styles.stage}>
            <p className={styles.srOnly} aria-live="polite">
              {phase === "greetings"
                ? "Loading Aarsh Singh's portfolio."
                : "Hello, I'm Aarsh. Welcome to my creative world."}
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {phase === "greetings" ? (
                <motion.div
                  key="greetings"
                  className={styles.greetingBlock}
                  aria-hidden="true"
                  exit={{ opacity: 0, y: "-6%", filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: EASE_ROLL }}
                >
                  <div className={styles.wordMask}>
                    <AnimatePresence initial={true}>
                      <motion.span
                        key={current.word}
                        className={styles.word}
                        lang={current.lang}
                        dir={current.dir ?? "ltr"}
                        style={{
                          fontFamily: current.font,
                          fontSize: `calc(var(--greeting-size) * ${current.scale})`,
                        }}
                        initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
                        animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                        exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
                        transition={wordTransition}
                      >
                        {current.word}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className={styles.caption}>
                    <span className={styles.langMask}>
                      <AnimatePresence initial={false}>
                        <motion.span
                          key={current.language}
                          className={styles.langName}
                          initial={{ y: "100%", opacity: 0 }}
                          animate={{ y: "0%", opacity: 1 }}
                          exit={{ y: "-100%", opacity: 0 }}
                          transition={wordTransition}
                        >
                          <span className={styles.dot} />
                          {current.language}
                        </motion.span>
                      </AnimatePresence>
                    </span>

                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="welcome"
                  className={styles.welcome}
                  initial="hidden"
                  animate="shown"
                  variants={{ shown: { transition: { staggerChildren: 0.09 } } }}
                >
                  <h1 className={styles.welcomeTitle}>
                    {[
                      { text: "Hello,", cls: "" },
                      { text: "I'm", cls: "" },
                      { text: "Aarsh.", cls: styles.accentWord },
                    ].map(({ text, cls }) => (
                      <span key={text} className={styles.lineMask}>
                        <motion.span
                          className={`${styles.lineInner} ${cls}`}
                          variants={
                            reduceMotion
                              ? { hidden: { opacity: 0 }, shown: { opacity: 1 } }
                              : {
                                  hidden: { y: "100%", opacity: 0 },
                                  shown: { y: "0%", opacity: 1 },
                                }
                          }
                          transition={{ duration: 0.9, ease: EASE_OUT }}
                        >
                          {text}
                        </motion.span>
                      </span>
                    ))}
                  </h1>
                  <span className={styles.lineMask}>
                    <motion.p
                      className={`${styles.lineInner} ${styles.welcomeSub}`}
                      variants={
                        reduceMotion
                          ? { hidden: { opacity: 0 }, shown: { opacity: 1 } }
                          : { hidden: { y: "110%" }, shown: { y: "0%" } }
                      }
                      transition={{ duration: 0.9, ease: EASE_OUT }}
                    >
                      Welcome to my <mark className={styles.highlight}>creative world.</mark>
                    </motion.p>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Visually hidden until focused — keeps a keyboard/screen-reader skip. */}
          <button type="button" className={styles.skip} onClick={skip} disabled={exiting}>
            Skip intro
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
