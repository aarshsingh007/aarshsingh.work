"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import { useFinePointer } from "@/hooks/useFinePointer";
import { CONTACT_THEME, site, type ContactIcon, type ContactRow } from "@/data/site";

const EASE = [0.22, 1, 0.36, 1] as const;
/* Footer links: the cursor shrinks to a dot over them and the link underlines. */
const FOOTER_LINK =
  "inline-flex min-h-11 items-center underline-offset-4 hover:text-(--c-text) hover:underline focus-visible:underline";

/* ---------- 24px line icons (1.5px stroke, currentColor) ---------- */

function Icon({ name }: { name: ContactIcon }) {
  if (name === "behance") {
    // Typographic mark, not a logo file.
    return (
      <span aria-hidden="true" className="contact-icon grid size-6 place-items-center text-[15px] leading-none font-semibold">
        Bē
      </span>
    );
  }
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "contact-icon shrink-0",
  };
  switch (name) {
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6.5 12 13l8.5-6.5" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 10.5V16" />
          <circle cx="8" cy="7.6" r="0.6" fill="currentColor" stroke="none" />
          <path d="M12 16v-5.5M12 13c0-1.6 1-2.6 2.4-2.6S16.5 11.2 16.5 13v3" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 4v11M7 10l5 5 5-5M5 19.5h14" />
        </svg>
      );
  }
}

/* ---------- row micro-interactions ---------- */

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789";
const DECODE_MS = 520;
const FRAME_MS = 38; // random glyphs change ~26×/s, not every frame

/** Which horizontal half of the row the pointer is on. */
const sideOf = (el: HTMLElement, x: number) => {
  const r = el.getBoundingClientRect();
  return x < r.left + r.width / 2 ? "left" : "right";
};

/** Label split into letters; each letter rolls up to its twin, staggered. */
function Wave({ text }: { text: string }) {
  return (
    <span aria-hidden="true" className="contact-wave">
      {Array.from(text).map((ch, i) => {
        const c = ch === " " ? "\u00A0" : ch;
        return (
          <span key={i} className="cw-cell" style={{ "--i": i } as React.CSSProperties}>
            <span className="cw-stack">
              <span>{c}</span>
              <span>{c}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ---------- one row ---------- */

function Row({ row }: { row: ContactRow }) {
  const { ui } = site.contact;
  const target = row.kind === "email" ? row.email.trim() : row.url.trim();
  const enabled = target !== "";
  const reduce = !!useReducedMotion();
  const fine = useFinePointer();
  const rowRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLSpanElement>(null);
  const addressRef = useRef<HTMLSpanElement>(null);
  const scrambleRaf = useRef(0);
  const [copied, setCopied] = useState(false);
  const [stamp, setStamp] = useState(0); // remount key for the stamp
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  /* Write into React's own text node, so the DOM never holds two copies. */
  const setAddress = (text: string) => {
    const node = addressRef.current?.firstChild;
    if (node && node.nodeType === Node.TEXT_NODE) node.nodeValue = text;
  };

  /* Stop any decode and restore the real address. */
  const stopScramble = () => {
    cancelAnimationFrame(scrambleRaf.current);
    scrambleRaf.current = 0;
    setAddress(target);
  };
  useEffect(() => () => cancelAnimationFrame(scrambleRaf.current), []);

  /* Address decodes left → right out of random glyphs (DOM text, no re-renders). */
  const scramble = () => {
    const el = addressRef.current;
    if (!el || reduce) return;
    stopScramble();
    const t0 = performance.now();
    let last = 0;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / DECODE_MS)); // rAF time can predate t0
      if (p >= 1) return stopScramble();
      if (t - last >= FRAME_MS) {
        last = t;
        const solved = Math.floor(p * target.length);
        let out = target.slice(0, solved);
        for (let i = solved; i < target.length; i++) {
          const ch = target[i];
          out += ch === "@" || ch === "." ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        setAddress(out);
      }
      scrambleRaf.current = requestAnimationFrame(tick);
    };
    scrambleRaf.current = requestAnimationFrame(tick);
  };

  /* Lime fill enters from the side the pointer came in, leaves toward the side it went out. */
  const onEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !fine) return;
    const rowEl = e.currentTarget;
    const wipe = wipeRef.current;
    const from = sideOf(rowEl, e.clientX);
    if (wipe && rowEl.dataset.from !== from) {
      // Park the fill on the entry edge without animating, then let it sweep in.
      wipe.style.transition = "none";
      rowEl.dataset.from = from;
      void wipe.offsetWidth;
      wipe.style.transition = "";
    }
    rowEl.dataset.on = "";
    scramble();
  };
  const onLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    const rowEl = e.currentTarget;
    rowEl.dataset.from = sideOf(rowEl, e.clientX);
    delete rowEl.dataset.on;
    stopScramble();
  };

  const copy = async () => {
    if (row.kind !== "email") return;
    try {
      await navigator.clipboard.writeText(row.email);
      setCopied(true);
      setStamp((n) => n + 1);
      setAnnounce(ui.copiedAnnouncement);
      // The stamp lands ~110ms in; the row takes the hit.
      if (!reduce) {
        rowRef.current?.animate(
          [{ transform: "none" }, { transform: "translateY(2px) scale(0.992)", offset: 0.35 }, { transform: "none" }],
          { duration: 280, delay: 110, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }
    } catch {
      // Fall back silently: select the address so it can be copied by hand.
      const el = addressRef.current;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  /* Disabled placeholder row: dimmed, not a link, "Coming soon" instead of the icon. */
  if (!enabled) {
    return (
      <div aria-disabled="true" data-cursor={site.contact.rowCursor.soon} data-cursor-tone="ink" className="contact-row opacity-50">
        <span className="text-[18px]">{row.label}</span>
        <span className="rounded-full border border-(--c-line) px-2.5 py-1 text-[11px] tracking-[0.08em] uppercase">
          {ui.comingSoon}
        </span>
      </div>
    );
  }

  const isEmail = row.kind === "email";
  const href = isEmail ? `mailto:${target}` : target;
  const linkProps =
    row.kind === "link"
      ? { target: "_blank", rel: "noopener noreferrer", "aria-label": `${row.label}, ${ui.newTab}` }
      : { "aria-label": `${row.label}, ${target}` };

  return (
    <div
      ref={rowRef}
      className="contact-row"
      data-enabled=""
      /* Ink cursor circle so it reads on the lime row. */
      data-cursor={site.contact.rowCursor[row.kind]}
      data-cursor-tone="ink"
      data-from="left"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {/* Lime fill that sweeps in from the pointer's side (or from the left on keyboard focus). */}
      <span ref={wipeRef} aria-hidden="true" className="contact-wipe" />
      {/* The whole row is the link; the Copy button sits above it. */}
      <a href={href} {...linkProps} className="absolute inset-0 z-[1] rounded-[14px]" />

      <span className="pointer-events-none relative z-[2] flex min-w-0 items-baseline gap-3">
        <span className="text-[18px]">
          <Wave text={row.label} />
        </span>
        {isEmail && (
          <span ref={addressRef} aria-hidden="true" className="contact-muted truncate text-[14px]">
            {target}
          </span>
        )}
      </span>

      <span className="relative z-[2] flex items-center gap-3">
        {isEmail && (
          <>
            <button
              type="button"
              onClick={copy}
              data-cursor={site.contact.rowCursor.copy}
              className="relative z-[3] inline-flex h-11 items-center rounded-full px-3 text-[12px] tracking-[0.06em] uppercase underline-offset-4 hover:underline"
            >
              {copied ? ui.copied : ui.copy}
            </button>
            <span aria-live="polite" className="sr-only">
              {announce}
            </span>
          </>
        )}
        <span className="pointer-events-none">
          <Icon name={row.icon} />
        </span>
      </span>

      {/* Rubber stamp that slams onto the row when the address is copied. */}
      {stamp > 0 && (
        <span key={stamp} aria-hidden="true" className="contact-stamp" onAnimationEnd={() => setStamp(0)}>
          {ui.stamp}
        </span>
      )}
    </div>
  );
}

/* ---------- section ---------- */

/** Contact — badge, "Let's connect", contact rows and a quiet footer. */
export default function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  const show = useInView(ref, { once: true, amount: 0.15 });
  const reduce = !!useReducedMotion();
  const { heading, subline, rows, footer } = site.contact;
  const dark = CONTACT_THEME === "dark";

  const fadeUp = (delay: number, y = 12) => ({
    initial: reduce ? false : ({ opacity: 0, y } as const),
    animate: show || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y },
    transition: { duration: 0.6, ease: EASE, delay: reduce ? 0 : delay },
  });

  const toTop = () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

  return (
    <section
      ref={ref}
      id="contact"
      aria-labelledby="contact-title"
      data-theme={CONTACT_THEME}
      data-nav-theme={CONTACT_THEME}
      /* Cursor: lime "Say hi" circle over empty areas; no tool trail here. */
      data-cursor-theme="contact"
      data-cursor={site.contact.cursor}
      data-no-trail=""
      className="contact-section px-(--gutter) pt-[14vh] pb-[8vh]"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        {/* Badge (decorative) */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={show || reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="w-[88px]"
        >
          <Badge text={site.hero.badge} decorative />
        </motion.div>

        {/* Heading: rises from a mask */}
        <h2
          id="contact-title"
          data-cursor-big=""
          className="mt-10 overflow-hidden pb-[0.12em] font-serif text-[clamp(52px,9vw,150px)] leading-[1] font-normal tracking-[-0.02em] whitespace-nowrap"
        >
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "105%" }}
            animate={show || reduce ? { y: "0%" } : { y: "105%" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          >
            {heading.before}{" "}
            <span className="relative isolate inline-block pr-[0.04em] italic">
              {dark ? (
                <span className="text-lime">{heading.accent}</span>
              ) : (
                <>
                  {/* Light theme: black text on a lime highlighter bar. */}
                  <motion.span
                    aria-hidden="true"
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={{ scaleX: show || reduce ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1], delay: 0.6 }}
                    className="absolute inset-x-[-0.06em] top-[45%] bottom-[8%] -z-10 origin-left bg-lime"
                  />
                  {heading.accent}
                </>
              )}
            </span>
          </motion.span>
        </h2>

        <motion.p {...fadeUp(0.3)} className="contact-muted mt-6 max-w-[34ch] text-[clamp(16px,1.4vw,20px)] leading-snug">
          {subline}
        </motion.p>

        {/* Rows — the cursor becomes an ink circle with the row's action. */}
        <ul className="mt-12 flex w-full max-w-[560px] flex-col gap-[10px] text-left">
          {rows.map((row, i) => (
            <motion.li key={row.label} {...fadeUp(0.4 + i * 0.06)}>
              <Row row={row} />
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      {/* Whole footer row: small dot cursor, so the "Say hi" circle never covers its text. */}
      <motion.footer
        {...fadeUp(0.4 + rows.length * 0.06 + 0.1, 0)}
        data-cursor-dot=""
        className="contact-muted mt-[12vh] flex flex-col items-center gap-4 border-t border-(--c-line) pt-6 text-[11px] font-medium tracking-[0.12em] uppercase sm:flex-row sm:justify-between"
      >
        <span>{footer.copyright.replace("{year}", String(new Date().getFullYear()))}</span>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6">
            {footer.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} data-cursor-dot="" className={FOOTER_LINK}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" onClick={toTop} data-cursor-dot="" className={`${FOOTER_LINK} uppercase`}>
          {footer.backToTop}
        </button>
      </motion.footer>
    </section>
  );
}
