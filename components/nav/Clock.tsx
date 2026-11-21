"use client";

import { useEffect, useState } from "react";
import { site } from "@/data/site";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: site.clock.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Live India clock ("14:32 IST"). Renders only after mount (no hydration
 * mismatch); aria-hidden, no live region.
 */
export default function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatter.format(new Date()));
    tick();
    let interval: number | undefined;
    // Align ticks to the wall-clock second so minutes flip on time.
    const align = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      window.clearTimeout(align);
      window.clearInterval(interval);
    };
  }, []);

  const [hh, mm] = (time ?? "--:--").split(":");

  return (
    <span aria-hidden="true" className="text-[12px] font-medium tracking-[0.06em] tabular-nums">
      {hh}
      {/* Colon breathes once a second — the clock feels live without moving digits. */}
      <span className="clock-colon">:</span>
      {mm} {site.clock.label}
    </span>
  );
}
