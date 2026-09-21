import type { SwimTime } from "@/types/swimming";
import type { SwimStroke } from "@/lib/constants/swimming";
import { isoWeekStart, todayISO, type ProgressPoint } from "@/lib/gym/derive";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export type SwimEvent = { stroke: SwimStroke; distanceM: number };

function eventKey(stroke: SwimStroke, distanceM: number) {
  return `${stroke}:${distanceM}`;
}

/** Every distinct (stroke, distance) combo with at least one time logged
 * — these are the "events" swimming's charts are grouped by, discovered
 * from the data itself rather than created up front like Gym's
 * exercises (there's nothing to set up: every combo is already valid). */
export function swimEventsWithData(times: SwimTime[]): SwimEvent[] {
  const seen = new Map<string, SwimEvent>();
  for (const t of times) {
    const key = eventKey(t.stroke, t.distance_m);
    if (!seen.has(key)) seen.set(key, { stroke: t.stroke, distanceM: t.distance_m });
  }
  return [...seen.values()];
}

/** One point per logged attempt for one event — not deduplicated or
 * aggregated per day, since repeating the same event several times in
 * one session (e.g. 3x 50m freestyle) is normal training and each
 * attempt is its own real data point. Sorted chronologically — by day
 * first, then by when it was logged within that day — so the raw time
 * genuinely rises and falls with real attempts instead of only ever
 * improving. */
export function swimTimeHistory(times: SwimTime[], event: SwimEvent): ProgressPoint[] {
  return times
    .filter((t) => t.stroke === event.stroke && t.distance_m === event.distanceM)
    .sort((a, b) => {
      if (a.session_date !== b.session_date) {
        return a.session_date < b.session_date ? -1 : 1;
      }
      return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
    })
    .map((t) => ({ date: t.session_date, value: t.time_seconds }));
}

export function bestSwimTime(times: SwimTime[], event: SwimEvent): number | null {
  const history = swimTimeHistory(times, event);
  if (history.length === 0) return null;
  return Math.min(...history.map((p) => p.value));
}

export function latestSwimTime(times: SwimTime[], event: SwimEvent): number | null {
  const history = swimTimeHistory(times, event);
  return history.length ? history.at(-1)!.value : null;
}

/** Times logged since this (Monday-start) week began — the swimming
 * equivalent of Gym's setsThisWeek, reusing the same week-boundary
 * helper since it's a plain date-string utility, not gym-specific. */
export function swimTimesThisWeek(times: SwimTime[]): number {
  const monday = isoWeekStart(todayISO());
  return times.filter((t) => t.session_date >= monday).length;
}

/** "1:23.45" for anything a minute or over, otherwise a bare "23.45" —
 * how swim times are actually read, instead of a raw seconds count. */
export function formatSwimTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  if (minutes === 0) return seconds.toFixed(2);
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
}

/** Ordinary least squares of time (seconds) against weeks-since-first-
 * point. Needs at least two points spread across different days —
 * with everything on one day the line has no defined slope. */
function linearTrendPerWeek(history: ProgressPoint[]): number | null {
  if (history.length < 2) return null;
  const firstMs = Date.parse(history[0].date);
  const xs = history.map((p) => (Date.parse(p.date) - firstMs) / MS_PER_WEEK);
  const ys = history.map((p) => p.value);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumXX = xs.reduce((sum, x) => sum + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  return (n * sumXY - sumX * sumY) / denom;
}

export type SwimGoalProgress = {
  targetSeconds: number;
  startSeconds: number;
  latestSeconds: number;
  bestSeconds: number;
  /** 0-100, how far latest is from start towards target. */
  progressPct: number;
  /** latest - start; negative means faster (an improvement). */
  improvementSinceStart: number;
  /** Seconds gained/lost per week from a linear fit of the whole
   * history; null when there isn't enough spread of days to fit one. */
  paceSecondsPerWeek: number | null;
  improving: boolean;
  /** ISO date the linear trend crosses the goal, or null when the goal
   * is already met or the trend isn't heading towards it. */
  etaDate: string | null;
};

/** Everything the goal card needs, derived purely from this event's own
 * time history — deliberately does not fold in data from other
 * modalities (e.g. Gym strength trends): there's no validated formula
 * linking the two, so mixing them in would dress up a guess as a
 * calculation. */
export function swimGoalProgress(
  history: ProgressPoint[],
  targetSeconds: number,
): SwimGoalProgress | null {
  if (history.length === 0) return null;

  const startSeconds = history[0].value;
  const latestSeconds = history.at(-1)!.value;
  const bestSeconds = Math.min(...history.map((p) => p.value));

  const totalGap = startSeconds - targetSeconds;
  const remainingGap = latestSeconds - targetSeconds;
  const progressPct =
    totalGap > 0
      ? Math.min(100, Math.max(0, ((startSeconds - latestSeconds) / totalGap) * 100))
      : latestSeconds <= targetSeconds
        ? 100
        : 0;

  const paceSecondsPerWeek = linearTrendPerWeek(history);
  const improving = paceSecondsPerWeek != null && paceSecondsPerWeek < 0;

  let etaDate: string | null = null;
  if (improving && remainingGap > 0 && paceSecondsPerWeek != null) {
    const weeksNeeded = remainingGap / -paceSecondsPerWeek;
    const lastMs = Date.parse(history.at(-1)!.date);
    etaDate = new Date(lastMs + weeksNeeded * MS_PER_WEEK).toISOString().slice(0, 10);
  }

  return {
    targetSeconds,
    startSeconds,
    latestSeconds,
    bestSeconds,
    progressPct,
    improvementSinceStart: latestSeconds - startSeconds,
    paceSecondsPerWeek,
    improving,
    etaDate,
  };
}
