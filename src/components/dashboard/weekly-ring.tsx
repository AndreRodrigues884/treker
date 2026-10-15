"use client";

import { useEffect, useState } from "react";
import { MODALITIES, type Modality } from "@/lib/constants/onboarding";

export type WeeklyRingSegment = { modality: Modality; count: number };

// Internal coordinate system only — the ring's actual on-screen size is
// controlled purely by CSS (the wrapper's responsive width/height
// classes below), so this never needs to change. The SVG scales via
// its viewBox, and badges are positioned in percentages of this same
// space, so everything shrinks together instead of the ring stacking
// under the text on a narrow screen (the point of keeping it a fixed
// side-by-side layout: it should always sit next to the text, just
// smaller, never dropped below it).
const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 96;
const STROKE = 16;
const GAP_DEG = 8;

// Deliberately not the modality tints used elsewhere (ModalityCard's
// orange/blue/emerald wash) — these are the ring's own saturated stroke
// colors, picked for contrast against the dark hero card and to read
// clearly as distinct arcs side by side.
const RING_COLOR: Record<Modality, { stroke: string; badge: string }> = {
  gym: { stroke: "#ef4444", badge: "border-red-400/40 bg-red-500/10 text-red-300" },
  running: { stroke: "#f97316", badge: "border-orange-400/40 bg-orange-500/10 text-orange-300" },
  swimming: { stroke: "#3b82f6", badge: "border-blue-400/40 bg-blue-500/10 text-blue-300" },
};

function polarToXY(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function pct(value: number) {
  return `${(value / SIZE) * 100}%`;
}

/**
 * This week's training, as one ring — one arc per tracked modality,
 * sized by its share of this week's sessions, with the total in the
 * center. Replaces the old flat row of three numbers with a single
 * glanceable shape, and animates in on mount (arcs draw in, badges pop,
 * the center count ticks up) for the "more alive" feel asked for,
 * while staying within the app's existing dark card look. Always sits
 * beside the greeting text, even on a phone — it shrinks through the
 * responsive size classes below rather than ever stacking underneath.
 */
export function WeeklyRing({ segments }: { segments: WeeklyRingSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const active = segments.filter((s) => s.count > 0);

  const [mounted, setMounted] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    // Two rAFs: the first just to get past the initial paint (so the
    // "hidden" starting styles below are what the browser actually
    // paints first), the second flips `mounted` — React's standard
    // mount-transition pattern, driven by plain CSS `transition`
    // rather than per-value @keyframes, since segment sizes differ
    // per user and aren't known ahead of time.
    const raf = requestAnimationFrame(() => setMounted(true));

    if (total === 0) return () => cancelAnimationFrame(raf);

    const duration = 700;
    let start: number | null = null;
    let frame: number;
    function tick(ts: number) {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayCount(Math.round(eased * total));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
    };
  }, [total]);

  // Only modalities with at least one session this week get an arc — a
  // 0-count tracked modality would otherwise need an arbitrary sliver
  // sliced out of the ring for nothing to show. A single active
  // modality fills the ring with no gap (there's nothing to separate
  // it from); two or more each get a trailing gap, wrapping around.
  const numGaps = active.length > 1 ? active.length : 0;
  const available = 360 - GAP_DEG * numGaps;

  // Each segment's start angle is the running total of every segment
  // (plus gap) before it — built as a fold rather than mutating a
  // captured `let` across iterations, since this runs during render.
  const arcs = active.reduce<
    Array<
      WeeklyRingSegment & {
        dashLen: number;
        dashOffset: number;
        badgePos: { x: number; y: number };
        icon: string;
        stroke: string;
        badge: string;
      }
    >
  >((acc, seg) => {
    const prev = acc.at(-1);
    const startDeg = prev
      ? ((prev.dashOffset + prev.dashLen) / 100) * 360 + (numGaps > 0 ? GAP_DEG : 0)
      : 0;
    const segDeg = total > 0 ? (seg.count / total) * available : 0;
    const midDeg = startDeg + segDeg / 2;

    const entry = MODALITIES.find((m) => m.value === seg.modality)!;
    const color = RING_COLOR[seg.modality];

    acc.push({
      ...seg,
      dashLen: (segDeg / 360) * 100,
      dashOffset: (startDeg / 360) * 100,
      badgePos: polarToXY(midDeg, RADIUS),
      icon: entry.icon,
      ...color,
    });
    return acc;
  }, []);

  return (
    <div className="relative aspect-square h-30 w-30 shrink-0 sm:h-40 sm:w-40 md:h-60 md:w-60">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-full w-full">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,.07)"
          strokeWidth={STROKE}
        />
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.modality}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={arc.stroke}
              strokeWidth={STROKE}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${arc.dashLen} ${100 - arc.dashLen}`}
              strokeDashoffset={mounted ? arc.dashOffset : arc.dashOffset + arc.dashLen}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.22,1,.36,1)" }}
            />
          ))}
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-3xl font-bold text-zinc-100 sm:text-2xl md:text-4xl">
          {displayCount}
        </span>
        {/* The label fits comfortably once the ring is big enough (from
         * sm: up) — at mobile size there isn't room for a second line
         * without it spilling past the ring's inner edge, so the big
         * number stands alone there; still read by screen readers. */}
        <span className="sr-only text-center text-[10px] leading-tight text-zinc-400 sm:not-sr-only sm:text-[10px] md:text-xs">
          {total === 1 ? "workout" : "workouts"} this week
        </span>
      </div>

      {arcs.map((arc, i) => (
        <div
          key={arc.modality}
          style={{
            position: "absolute",
            left: pct(arc.badgePos.x),
            top: pct(arc.badgePos.y),
            transform: mounted
              ? "translate(-50%, -50%) scale(1)"
              : "translate(-50%, -50%) scale(.5)",
            opacity: mounted ? 1 : 0,
            transition: `opacity .4s ease-out ${0.5 + i * 0.15}s, transform .4s cubic-bezier(.22,1,.36,1) ${0.5 + i * 0.15}s`,
          }}
          className={`flex items-center gap-1 rounded-full border bg-slate-900/90 px-1.5 py-0.5 sm:gap-1 sm:px-2 sm:py-1 ${arc.badge}`}
        >
          <span aria-hidden className="text-[10px] sm:text-xs">
            {arc.icon}
          </span>
          <span className="text-[10px] font-bold sm:text-xs">{arc.count}</span>
        </div>
      ))}
    </div>
  );
}
