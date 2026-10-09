import type { Run, RunningPr } from "@/types/running";
import { STANDARD_DISTANCES, type StandardDistance } from "@/lib/constants/running";
import { isoWeekStart, todayISO, type ProgressPoint } from "@/lib/gym/derive";

/** "1:05:23" for anything an hour or over, otherwise "23:45" — how a
 * run's total duration is actually read. */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "5:23/km" — pace read as minutes:seconds per kilometer. */
export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}/km`;
}

/** Seconds per km — the one normalized number every other running stat
 * (trend, personal bests) compares runs by, since raw duration alone
 * isn't comparable across different distances. */
export function pace(run: Run): number {
  return run.duration_seconds / Number(run.distance_km);
}

/** Pace per run, oldest to newest — lower is faster, same "unclamped,
 * a bad day is a real dip" convention as swimTimeHistory. */
export function paceHistory(runs: Run[]): ProgressPoint[] {
  return [...runs]
    .sort((a, b) => {
      if (a.session_date !== b.session_date) {
        return a.session_date < b.session_date ? -1 : 1;
      }
      return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
    })
    .map((r) => ({ date: r.session_date, value: pace(r) }));
}

/** The most recently logged run, by the same (date, then logged-order)
 * sort paceHistory uses — the run a card's "current" stats should read
 * from, so they always describe one real, specific run rather than an
 * aggregate. */
export function mostRecentRun(runs: Run[]): Run | null {
  if (runs.length === 0) return null;
  return [...runs].sort((a, b) => {
    if (a.session_date !== b.session_date) {
      return a.session_date < b.session_date ? -1 : 1;
    }
    return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
  }).at(-1)!;
}

export type WeekDistance = { weekStart: string; distanceKm: number };

/** Total km logged per (Monday-start) week, for the last `weeks` weeks
 * up to and including this one — always exactly that many entries,
 * zero-filled, same convention as gym's sessionsPerWeekHistory. */
export function weeklyDistanceHistory(runs: Run[], weeks = 5): WeekDistance[] {
  const byWeek = new Map<string, number>();
  for (const r of runs) {
    const week = isoWeekStart(r.session_date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + Number(r.distance_km));
  }

  const currentWeekStart = isoWeekStart(todayISO());
  const result: WeekDistance[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${currentWeekStart}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const weekStart = d.toISOString().slice(0, 10);
    result.push({ weekStart, distanceKm: byWeek.get(weekStart) ?? 0 });
  }
  return result;
}

/** Runs logged since this (Monday-start) week began — every run counts
 * (not distinct days): two runs in a day are two separate workouts, not
 * one session split into sets like Gym. */
export function runsThisWeek(runs: Run[]): number {
  const monday = isoWeekStart(todayISO());
  return runs.filter((r) => r.session_date >= monday).length;
}

export function totalDistanceThisWeek(runs: Run[]): number {
  const monday = isoWeekStart(todayISO());
  return runs
    .filter((r) => r.session_date >= monday)
    .reduce((sum, r) => sum + Number(r.distance_km), 0);
}

/** The closest standard race distance to a logged run, if it's within
 * 2% of it — loose enough to cover normal measuring variance on a real
 * 5K route, tight enough that an unrelated 7km run doesn't get counted
 * toward "5K" by mistake. There's no manual "this was a race" tag —
 * every run is checked the same way, same derive-don't-store spirit as
 * the rest of the app's automatic PR detection. */
export function matchStandardDistance(distanceKm: number): StandardDistance | null {
  for (const d of STANDARD_DISTANCES) {
    if (Math.abs(distanceKm - d.km) / d.km <= 0.02) return d;
  }
  return null;
}

/** Every logged run within tolerance of one standard distance — what
 * the pace-progression chart for that distance is built from. */
export function runsForDistance(runs: Run[], distance: StandardDistance): Run[] {
  return runs.filter(
    (r) => matchStandardDistance(Number(r.distance_km))?.value === distance.value,
  );
}

export type PersonalBest = {
  distance: StandardDistance;
  run: Run;
  paceSecPerKm: number;
};

/** The fastest logged run at each standard distance — not the most
 * recent attempt, the best (lowest pace) among however many runs land
 * within tolerance of that distance. Only returns entries for distances
 * that have at least one matching run. */
export function personalBests(runs: Run[]): PersonalBest[] {
  const bestByDistance = new Map<string, PersonalBest>();
  for (const run of runs) {
    const distance = matchStandardDistance(Number(run.distance_km));
    if (!distance) continue;
    const paceSecPerKm = pace(run);
    const existing = bestByDistance.get(distance.value);
    if (!existing || paceSecPerKm < existing.paceSecPerKm) {
      bestByDistance.set(distance.value, { distance, run, paceSecPerKm });
    }
  }
  return STANDARD_DISTANCES.map((d) => bestByDistance.get(d.value)).filter(
    (pb): pb is PersonalBest => pb != null,
  );
}

/** Just the current PB per standard distance, out of the full PR
 * history — running_prs is an append-only log, same reasoning as Gym's
 * latestPrPerExercise: a PR is only ever inserted when it beats the
 * prior one, so the most recent row per distance is always its best.
 * Assumes `prs` is already sorted most-recent-first (what
 * getRunningPrs returns). */
export function latestPrPerDistance(prs: RunningPr[]): RunningPr[] {
  const seen = new Set<string>();
  const result: RunningPr[] = [];
  for (const pr of prs) {
    if (seen.has(pr.distance_value)) continue;
    seen.add(pr.distance_value);
    result.push(pr);
  }
  return result;
}
