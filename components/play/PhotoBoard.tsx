"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import MagneticButton from "@/components/hero/MagneticButton";
import { playItems, type PlayItem, type PlayPhoto } from "@/data/play";
import { site } from "@/data/site";
import PhotoViewer from "./PhotoViewer";

/* ---------- layout maths ---------- */

type Ctrl = {
  el: HTMLDivElement;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rest: MotionValue<number>;
  fit: MotionValue<number>;
};
/** Position as a fraction of the free space (board − item), plus rotation and scale. */
type Frac = { fx: number; fy: number; r: number; s: number };

const SPRING = { type: "spring", stiffness: 170, damping: 22, mass: 0.9 } as const;
const ASPECT = { portrait: 1.3, square: 1, landscape: 0.75 } as const;

/* Small seeded PRNG — identical on server and client. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Jittered-grid scatter: spread out, overlaps allowed, rotations −8°…8°. */
function scatter(n: number, w: number, h: number, seed: number): Frac[] {
  const rand = rng(seed);
  const cols = Math.max(2, Math.round(Math.sqrt((n * w) / Math.max(h, 1))));
  const rows = Math.ceil(n / cols);
  const cells = Array.from({ length: cols * rows }, (_, i) => i).sort(() => rand() - 0.5);
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return Array.from({ length: n }, (_, i) => {
    const cell = cells[i];
    const c = cell % cols;
    const r = Math.floor(cell / cols);
    return {
      fx: clamp((c + 0.5 + (rand() - 0.5) * 0.9) / cols),
      fy: clamp((r + 0.5 + (rand() - 0.5) * 0.9) / rows),
      r: rand() * 16 - 8,
      s: 1,
    };
  });
}

/* Neat wrapped rows, scaled down until everything fits the board. */
function tidy(sizes: { iw: number; ih: number }[], w: number, h: number, mobile: boolean): Frac[] {
  const pad = mobile ? 10 : 24;
  const gap = mobile ? 8 : 16;
  for (let s = 1; s >= 0.3; s -= 0.04) {
    const rows: number[][] = [[]];
    let x = 0;
    sizes.forEach(({ iw }, i) => {
      const vw = iw * s;
      if (x > 0 && x + vw > w - pad * 2) {
        rows.push([]);
        x = 0;
      }
      rows[rows.length - 1].push(i);
      x += vw + gap;
    });
    const rowH = rows.map((row) => Math.max(...row.map((i) => sizes[i].ih * s)));
    const total = rowH.reduce((a, b) => a + b, 0) + gap * (rows.length - 1);
    if (total > h - pad * 2 && s > 0.31) continue;

    const out: Frac[] = new Array(sizes.length);
    let vy = (h - total) / 2;
    rows.forEach((row, ri) => {
      const rowW = row.reduce((a, i) => a + sizes[i].iw * s, 0) + gap * (row.length - 1);
      let vx = (w - rowW) / 2;
      row.forEach((i) => {
        const { iw, ih } = sizes[i];
        // Items scale around their centre, so offset the layout position.
        const lx = vx - ((1 - s) * iw) / 2;
        const ly = vy + (rowH[ri] - ih * s) / 2 - ((1 - s) * ih) / 2;
        out[i] = { fx: lx / Math.max(1, w - iw), fy: ly / Math.max(1, h - ih), r: 0, s };
        vx += iw * s + gap;
      });
      vy += rowH[ri] + gap;
    });
    return out;
  }
  return sizes.map(() => ({ fx: 0.5, fy: 0.5, r: 0, s: 0.3 }));
}

/* ---------- item faces ---------- */

function PhotoFace({ photo, n }: { photo: PlayPhoto; n: number }) {
  const hasText = Boolean(photo.caption || photo.tag);
  return (
    <div
      className="pb-photo"
      style={{
        background: `var(--frame-${photo.tone})`,
        paddingBottom: hasText ? "calc(var(--pw) * 0.053)" : "calc(var(--pw) * 0.18)",
      }}
    >
      <div
        className="pb-media"
        style={{
          height: `calc(var(--pw) * 0.894 * ${ASPECT[photo.aspect]})`,
          background: photo.src ? undefined : `var(--cover-${photo.cover})`,
        }}
      >
        {photo.src ? (
          <Image
            src={photo.src}
            alt=""
            fill
            draggable={false}
            loading="lazy"
            sizes="(min-width: 768px) 220px, 120px"
            className="pointer-events-none object-cover"
          />
        ) : (
          <>
            <span className="pb-photo-label">{photo.alt}</span>
            <span className="pb-glyph">{n}</span>
          </>
        )}
      </div>
      {hasText && (
        <div className="pb-caption">
          {photo.caption && <p className="truncate">{photo.caption}</p>}
          {photo.tag && <p className="truncate opacity-75">{photo.tag}</p>}
        </div>
      )}
    </div>
  );
}

function NoteFace({ value, label }: { value: string; label: string }) {
  return (
    <div className="pb-note">
      <span className="pb-note-value">{value}</span>
      <span className="pb-note-label">{label}</span>
    </div>
  );
}

/* ---------- one draggable item ---------- */

type ItemApi = {
  register: (id: string, c: Ctrl | null) => void;
  front: () => number;
  commit: (id: string) => void;
  nudge: (id: string, dx: number, dy: number) => void;
  open: (id: string, el: HTMLElement) => void;
};

function BoardItem({
  item,
  photoNumber,
  enhanced,
  reduce,
  boardRef,
  api,
}: {
  item: PlayItem;
  photoNumber: number;
  enhanced: boolean;
  reduce: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
  api: ItemApi;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rest = useMotionValue(0);
  const fit = useMotionValue(1);
  const lift = useMotionValue(1);
  const zIndex = useMotionValue(1);
  const shadow = useMotionValue("0 0 0 rgba(0,0,0,0)");
  const tiltRaw = useMotionValue(0);
  const tilt = useSpring(tiltRaw, { stiffness: 220, damping: 24 });
  const rotate = useTransform(() => rest.get() + tilt.get());
  const scale = useTransform(() => fit.get() * lift.get());
  const dragged = useRef(false);

  useLayoutEffect(() => {
    if (ref.current) api.register(item.id, { el: ref.current, x, y, rest, fit });
    return () => api.register(item.id, null);
  }, [api, item.id, x, y, rest, fit]);

  const isPhoto = item.kind === "photo";
  const label = isPhoto
    ? `${item.alt}, arrow keys move it, Enter opens a larger view`
    : `${item.value} ${item.label}, arrow keys move it`;

  const setCursor = (text: string) => {
    const el = ref.current;
    if (!el) return;
    el.dataset.cursor = text;
    // Nudge the custom cursor to re-read its label while the pointer stays put.
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 48 : 12;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key] && enhanced) {
      e.preventDefault();
      zIndex.set(api.front());
      api.nudge(item.id, ...moves[e.key]);
    } else if ((e.key === "Enter" || e.key === " ") && isPhoto) {
      e.preventDefault();
      api.open(item.id, e.currentTarget as HTMLElement);
    }
  };

  return (
    <motion.div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={label}
      data-cursor="Drag"
      onKeyDown={onKeyDown}
      onPointerDown={() => {
        dragged.current = false;
        zIndex.set(api.front());
      }}
      onClick={(e) => {
        if (!dragged.current && isPhoto) api.open(item.id, e.currentTarget);
      }}
      drag={enhanced}
      dragConstraints={boardRef}
      dragElastic={0.08}
      dragMomentum={!reduce}
      dragTransition={{ power: 0.25, timeConstant: 260, bounceStiffness: 320, bounceDamping: 26 }}
      onDragStart={() => {
        dragged.current = true;
        if (ref.current) ref.current.style.willChange = "transform";
        animate(lift, 1.05, { duration: reduce ? 0 : 0.2 });
        shadow.set("0 10px 28px rgba(0,0,0,0.12)");
        setCursor("Drop");
      }}
      onDrag={(_, info) => {
        if (!reduce) tiltRaw.set(Math.max(-6, Math.min(6, info.velocity.x / 120)));
      }}
      onDragEnd={() => {
        tiltRaw.set(0);
        animate(lift, 1, { duration: reduce ? 0 : 0.25 });
        shadow.set("0 0 0 rgba(0,0,0,0)");
        setCursor("Drag");
      }}
      onDragTransitionEnd={() => {
        if (ref.current) ref.current.style.willChange = "";
        api.commit(item.id);
      }}
      style={
        enhanced
          ? { x, y, rotate, scale, zIndex, boxShadow: shadow, position: "absolute", left: 0, top: 0, touchAction: "none" }
          : undefined
      }
      className={`pb-item ${isPhoto ? "pb-item-photo" : "pb-item-note"} focus-visible:outline-offset-4`}
    >
      {isPhoto ? <PhotoFace photo={item} n={photoNumber} /> : <NoteFace value={item.value} label={item.label} />}
    </motion.div>
  );
}

/* ---------- the board ---------- */

export default function PhotoBoard() {
  const reduce = !!useReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const inView = useInView(boardRef, { once: true, amount: 0.35 });
  const ctrls = useRef(new Map<string, Ctrl>());
  const fracs = useRef(new Map<string, Frac>());
  const size = useRef({ w: 0, h: 0 });
  const zTop = useRef(10);
  const seed = useRef(7);
  const layout = useRef<"stack" | "scatter" | "tidy" | "custom">("stack");
  const dealt = useRef(false);
  const [announce, setAnnounce] = useState("");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const photos = useMemo(() => playItems.filter((i): i is PlayPhoto => i.kind === "photo"), []);
  const { hint, shuffle: shuffleLabel, tidy: tidyLabel, boardLabel, boardInstructions } = site.play;

  const measure = () => {
    const b = boardRef.current;
    if (b) size.current = { w: b.clientWidth, h: b.clientHeight };
  };
  const dims = (c: Ctrl) => ({ iw: c.el.offsetWidth, ih: c.el.offsetHeight });
  const isMobile = () => size.current.w < 600;

  /** Move one item to a fractional position. */
  const place = useCallback(
    (id: string, f: Frac, instant: boolean, delay = 0) => {
      const c = ctrls.current.get(id);
      if (!c) return;
      const { w, h } = size.current;
      const { iw, ih } = dims(c);
      const tx = f.fx * Math.max(0, w - iw);
      const ty = f.fy * Math.max(0, h - ih);
      fracs.current.set(id, f);
      if (instant || reduce) {
        c.x.set(tx);
        c.y.set(ty);
        c.rest.set(f.r);
        c.fit.set(f.s);
        return;
      }
      const t = { ...SPRING, delay };
      animate(c.x, tx, t);
      animate(c.y, ty, t);
      animate(c.rest, f.r, t);
      animate(c.fit, f.s, t);
    },
    [reduce]
  );

  const applyScatter = useCallback(
    (instant: boolean, stagger = 0.04) => {
      const { w, h } = size.current;
      const fs = scatter(playItems.length, w, h, seed.current);
      playItems.forEach((it, i) => place(it.id, fs[i], instant, i * stagger));
      layout.current = "scatter";
    },
    [place]
  );

  const applyTidy = useCallback(
    (instant: boolean) => {
      const { w, h } = size.current;
      const sizes = playItems.map((it) => {
        const c = ctrls.current.get(it.id);
        return c ? dims(c) : { iw: 120, ih: 160 };
      });
      const fs = tidy(sizes, w, h, isMobile());
      playItems.forEach((it, i) => place(it.id, fs[i], instant, i * 0.03));
      layout.current = "tidy";
    },
    [place]
  );

  /* Progressive enhancement: switch from the plain grid to the board after mount. */
  useLayoutEffect(() => setEnhanced(true), []);

  /* Once enhanced: stack everything at the centre, ready to be dealt. */
  useLayoutEffect(() => {
    if (!enhanced) return;
    measure();
    const rand = rng(3);
    playItems.forEach((it) => place(it.id, { fx: 0.5, fy: 0.5, r: rand() * 10 - 5, s: 1 }, true));
  }, [enhanced, place]);

  /* Deal out when 35% in view (instantly under reduced motion). */
  useEffect(() => {
    if (!enhanced || !inView || dealt.current) return;
    dealt.current = true;
    applyScatter(reduce, 0.06);
  }, [enhanced, inView, reduce, applyScatter]);

  /* Keep the layout on resize (debounced): re-tidy, or re-place from fractions. */
  useEffect(() => {
    const b = boardRef.current;
    if (!b || !enhanced) return;
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        measure();
        if (layout.current === "tidy") applyTidy(true);
        else fracs.current.forEach((f, id) => place(id, f, true));
      }, 150);
    });
    ro.observe(b);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [enhanced, applyTidy, place]);

  const api: ItemApi = useMemo(
    () => ({
      register: (id, c) => {
        if (c) ctrls.current.set(id, c);
        else ctrls.current.delete(id);
      },
      front: () => ++zTop.current,
      commit: (id) => {
        const c = ctrls.current.get(id);
        const f = fracs.current.get(id);
        if (!c || !f) return;
        const { w, h } = size.current;
        const { iw, ih } = dims(c);
        fracs.current.set(id, {
          ...f,
          fx: Math.min(1, Math.max(0, c.x.get() / Math.max(1, w - iw))),
          fy: Math.min(1, Math.max(0, c.y.get() / Math.max(1, h - ih))),
        });
        layout.current = "custom";
      },
      nudge: (id, dx, dy) => {
        const c = ctrls.current.get(id);
        const f = fracs.current.get(id);
        if (!c || !f) return;
        const { w, h } = size.current;
        const { iw, ih } = dims(c);
        const nx = Math.min(Math.max(0, w - iw), Math.max(0, c.x.get() + dx));
        const ny = Math.min(Math.max(0, h - ih), Math.max(0, c.y.get() + dy));
        c.x.set(nx);
        c.y.set(ny);
        fracs.current.set(id, { ...f, fx: nx / Math.max(1, w - iw), fy: ny / Math.max(1, h - ih) });
        layout.current = "custom";
      },
      open: (id, el) => {
        const i = photos.findIndex((p) => p.id === id);
        if (i < 0) return;
        opener.current = el;
        setViewerIndex(i);
      },
    }),
    [photos]
  );

  const onShuffle = () => {
    seed.current += 1;
    applyScatter(false);
    setAnnounce(`${site.play.announceShuffle}.`);
  };
  const onTidy = () => {
    applyTidy(false);
    setAnnounce(`${site.play.announceTidy}.`);
  };

  let photoCount = 0;

  return (
    <>
      {/* Header row: heading/hint left, actions right (stacked on mobile). */}
      <div className="flex flex-col gap-6 px-(--gutter) sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="play-title"
            className="font-serif text-[clamp(2.75rem,9vw,6.5rem)] leading-none font-normal tracking-[-0.02em]"
          >
            {site.play.heading}
          </h2>
          <p className="mt-4 text-[15px]">{hint}</p>
        </div>
        <div className="flex items-center gap-3">
          <MagneticButton onClick={onShuffle} noArrow>
            {shuffleLabel}
          </MagneticButton>
          <MagneticButton onClick={onTidy} noArrow>
            {tidyLabel}
          </MagneticButton>
        </div>
      </div>

      <div className="mt-8 px-(--gutter) sm:mt-10">
        <div
          ref={boardRef}
          role="group"
          aria-label={boardLabel}
          aria-describedby="play-board-help"
          className={`pb-board play-tokens mx-auto w-full max-w-[1200px] ${enhanced ? "pb-board-live" : "pb-board-static"}`}
        >
          <p id="play-board-help" className="sr-only">
            {boardInstructions}
          </p>
          {playItems.map((item) => {
            const n = item.kind === "photo" ? ++photoCount : 0;
            return (
              <BoardItem
                key={item.id}
                item={item}
                photoNumber={n}
                enhanced={enhanced}
                reduce={reduce}
                boardRef={boardRef}
                api={api}
              />
            );
          })}
        </div>
        <p aria-live="polite" className="sr-only">
          {announce}
        </p>
      </div>

      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => {
            setViewerIndex(null);
            opener.current?.focus();
          }}
        />
      )}
    </>
  );
}
