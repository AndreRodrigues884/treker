import type { SwimTime } from "@/types/swimming";
import type { SwimStroke } from "@/lib/constants/swimming";
import { isoWeekStart, todayISO, type ProgressPoint } from "@/lib/gym/derive";

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
