"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIntroReady } from "@/components/IntroProvider";
import RollText from "@/components/ui/RollText";
import { site } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import Availability from "./Availability";
import Clock from "./Clock";

const EASE = [0.22, 1, 0.36, 1] as const;
const SOLID_AFTER = 40; // px of scroll before the nav gets its white background

/* Thin black underline that draws in on hover / keyboard focus. */
const UNDERLINE =
  "absolute inset-x-0 bottom-2.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100";

const SECTION_IDS = site.nav.map((l) => l.href.slice(1));

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <a href="#top" onClick={onClick} className="group inline-flex min-h-11 items-center text-[14px] font-medium">
      <RollText>{site.name}</RollText>
      {/* ® does a full turn on hover. */}
      <sup className="ml-0.5 inline-block text-[0.6em] transition-transform duration-700 ease-out group-hover:rotate-360 motion-reduce:transition-none">
        {site.mark}
      </sup>
    </a>
  );
}

export default function Nav() {
  const ready = useIntroReady();
  const active = useActiveSection(SECTION_IDS);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* White background fades in after 40px of scroll (state flips only at the threshold). */
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const onScroll = useCallback((y: number) => setSolid(y > SOLID_AFTER), []);
  useMotionValueEvent(scrollY, "change", onScroll);
  useEffect(() => onScroll(window.scrollY), [onScroll]);

  /*
   * Dark nav while a [data-nav-theme="dark"] section sits under it. The
   * observer's root is shrunk to the nav's own band at the top of the viewport.
   */
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-theme="dark"]'));
    if (!sections.length) return;
    let io: IntersectionObserver | undefined;
    const under = new Set<Element>();
    const build = () => {
      io?.disconnect();
      under.clear();
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) * 16 || 64;
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
          setDark(under.size > 0);
        },
        { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - navH)}px 0px` }
      );
      sections.forEach((el) => io!.observe(el));
    };
    build();
    window.addEventListener("resize", build);
    return () => {
      window.removeEventListener("resize", build);
      io?.disconnect();
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => setMounted(true), []);

  /* Mobile menu: focus trap, Esc to close, scroll lock. */
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const focusables = () =>
      Array.from(menu?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
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
    };
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open, close]);

  /* Close the menu if the viewport grows past the mobile breakpoint. */
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => mql.matches && setOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <motion.header
      data-animate
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      data-nav-theme={dark ? "dark" : "light"}
      data-cursor-theme={dark ? "dark" : undefined}
      /* Fixed: always visible. z-40 sits above sections, below the menu (50), dialogs (70) and preloader. */
      className={`site-nav fixed inset-x-0 top-0 z-40 h-(--nav-h) ${
        dark ? "bg-ink text-white" : solid ? "bg-bg text-ink" : "bg-transparent text-ink"
      }`}
    >
      <div className="flex h-full items-center justify-between gap-6 px-(--gutter)">
        <Brand />

        <div className="flex items-center gap-2 md:gap-8">
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-6">
              {site.nav.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={active === link.href.slice(1) ? "location" : undefined}
                    className="group relative inline-flex min-h-11 items-center text-[14px] focus-visible:outline-offset-4"
                  >
                    <RollText>{link.label}</RollText>
                    <span aria-hidden="true" className={`nav-underline ${UNDERLINE}`} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Availability className="hidden lg:inline-flex" />
          <Clock />

          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="group relative -mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-[14px] md:hidden"
          >
            <RollText>Menu</RollText>
            {/* Two short lines that pull apart on hover. */}
            <span aria-hidden="true" className="relative block h-2 w-4">
              <span className="absolute inset-x-0 top-0 h-px bg-current transition-transform duration-300 group-hover:-translate-y-px" />
              <span className="absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-300 group-hover:translate-y-px" />
            </span>
          </button>
        </div>
      </div>

      {/* Full-screen mobile menu — portalled so the header can't contain it */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                id="mobile-menu"
                ref={menuRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
                transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                className="fixed inset-0 z-50 flex flex-col bg-bg px-(--gutter) text-ink md:hidden"
              >
                <div className="flex h-(--nav-h) items-center justify-between">
                  <Brand onClick={() => setOpen(false)} />
                  <button
                    type="button"
                    onClick={close}
                    className="group -mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-[14px]"
                  >
                    <RollText>Close</RollText>
                    {/* The two lines cross into an × and turn a little more on hover. */}
                    <span aria-hidden="true" className="relative block size-3 transition-transform duration-300 group-hover:rotate-90">
                      <span className="absolute top-1/2 left-0 h-px w-full rotate-45 bg-ink" />
                      <span className="absolute top-1/2 left-0 h-px w-full -rotate-45 bg-ink" />
                    </span>
                  </button>
                </div>

                <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center">
                  <ul className="flex flex-col gap-2">
                    {site.nav.map((link, i) => {
                      const current = active === link.href.slice(1);
                      return (
                        <li key={link.href} className="overflow-hidden">
                          <motion.a
                            href={link.href}
                            onClick={() => setOpen(false)}
                            aria-current={current ? "location" : undefined}
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.06 }}
                            className="group relative flex min-h-11 items-baseline gap-4 font-serif text-[clamp(3rem,15vw,4.5rem)] leading-[1.1]"
                          >
                            <span className="font-sans text-[12px] tabular-nums">0{i + 1}</span>
                            <span className="relative isolate">
                              {/* Lime marker behind the section you're in. */}
                              {current && (
                                <span aria-hidden="true" className="absolute inset-x-[-0.06em] top-[45%] bottom-[12%] -z-10 bg-lime" />
                              )}
                              <RollText>{link.label}</RollText>
                            </span>
                          </motion.a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="flex flex-col gap-4 pb-[max(var(--gutter),env(safe-area-inset-bottom))]">
                  <Availability className="inline-flex self-start" />
                  <div className="flex items-center justify-between">
                    <Clock />
                    <span className="text-[12px]">{site.role}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.header>
  );
}
