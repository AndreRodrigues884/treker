import type { ExerciseSet } from "@/lib/gym/queries";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function setsForDate(sets: ExerciseSet[], date: string): ExerciseSet[] {
  return sets.filter((s) => s.session_date === date);
}

/** The most recent session strictly before `date`, or null if there isn't one. */
export function lastSessionBefore(
  sets: ExerciseSet[],
  date: string,
): ExerciseSet[] | null {
  const priorDates = [
    ...new Set(sets.filter((s) => s.session_date < date).map((s) => s.session_date)),
  ].sort();
  const lastDate = priorDates.at(-1);
  if (!lastDate) return null;
  return sets.filter((s) => s.session_date === lastDate);
}

export type ProgressPoint = { date: string; value: number };

/** One point per session_date: total volume (kg × reps) if the exercise
 * tracks load, otherwise total reps. Sorted oldest to newest. */
export function progressHistory(
  sets: ExerciseSet[],
  tracksLoad: boolean,
): ProgressPoint[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    const value = tracksLoad ? (s.weight_kg ?? 0) * s.reps : s.reps;
    byDate.set(s.session_date, (byDate.get(s.session_date) ?? 0) + value);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}
