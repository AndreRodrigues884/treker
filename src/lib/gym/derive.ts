import type { Exercise, ExerciseSet } from "@/lib/gym/queries";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants/gym";

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

/** The single most recent session's sets, whatever its date — including
 * today's, if you just saved one. Once a session is saved there's
 * nothing special about "today" any more: the next visit starts fully
 * unfilled, and this is purely the "last time" reference. */
export function mostRecentSession(sets: ExerciseSet[]): ExerciseSet[] | null {
  if (sets.length === 0) return null;
  const dates = [...new Set(sets.map((s) => s.session_date))].sort();
  const latest = dates.at(-1)!;
  return sets.filter((s) => s.session_date === latest);
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

/** Which unit a routine's combined chart is in: "kg" if every exercise
 * in it tracks load, "reps" if none do, or "" (a mixed, unitless count)
 * when it has both kinds. */
export function routineUnit(exercises: Exercise[]): "kg" | "reps" | "" {
  if (exercises.length === 0) return "";
  const allTrackLoad = exercises.every((e) => e.tracks_load);
  if (allTrackLoad) return "kg";
  const noneTrackLoad = exercises.every((e) => !e.tracks_load);
  return noneTrackLoad ? "reps" : "";
}

/** Same idea as progressHistory, but combined across every exercise in a
 * routine — each set contributes by its OWN exercise's tracks_load, not
 * a single flag for everything, since a routine can mix load and
 * bodyweight exercises. This is what a routine's one shared chart plots. */
export function routineProgressHistory(
  exercises: Exercise[],
  sets: ExerciseSet[],
): ProgressPoint[] {
  const tracksLoadByExercise = new Map(exercises.map((e) => [e.id, e.tracks_load]));
  const byDate = new Map<string, number>();
  for (const s of sets) {
    const tracksLoad = tracksLoadByExercise.get(s.exercise_id) ?? true;
    const value = tracksLoad ? (s.weight_kg ?? 0) * s.reps : s.reps;
    byDate.set(s.session_date, (byDate.get(s.session_date) ?? 0) + value);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}

// --- Statistics (across every exercise, not one muscle group) ---

/** Epley formula: a rough estimate of the max you could lift once, from
 * any weight × reps you actually did. */
export function estimatedOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

export type ExerciseOneRepMax = {
  exerciseId: string;
  exerciseName: string;
  oneRepMax: number;
};

/** Each load-tracking exercise's best-ever estimated 1RM, highest first. */
export function bestOneRepMaxPerExercise(
  exercises: Exercise[],
  sets: ExerciseSet[],
): ExerciseOneRepMax[] {
  return exercises
    .filter((e) => e.tracks_load)
    .map((exercise) => {
      const best = sets
        .filter((s) => s.exercise_id === exercise.id && s.weight_kg != null)
        .reduce(
          (max, s) => Math.max(max, estimatedOneRepMax(s.weight_kg!, s.reps)),
          0,
        );
      return { exerciseId: exercise.id, exerciseName: exercise.name, oneRepMax: best };
    })
    .filter((e) => e.oneRepMax > 0)
    .sort((a, b) => b.oneRepMax - a.oneRepMax);
}

export function totalStrength(perExercise: ExerciseOneRepMax[]): number {
  return perExercise.reduce((sum, e) => sum + e.oneRepMax, 0);
}

/** Each session date's best estimated 1RM for one exercise — not a
 * running max, so a lighter/deload session shows as a real dip, not
 * hidden behind a plateaued high-water mark. */
export function oneRepMaxHistory(sets: ExerciseSet[]): ProgressPoint[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    if (s.weight_kg == null) continue;
    const oneRm = estimatedOneRepMax(s.weight_kg, s.reps);
    byDate.set(s.session_date, Math.max(byDate.get(s.session_date) ?? 0, oneRm));
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}

/** "Força Total" over time: the running best 1RM per exercise (a
 * personal-record high-water mark, unlike oneRepMaxHistory above),
 * summed across every load-tracking exercise as of each session date —
 * this is deliberately monotonic, since it only moves when a PR does. */
export function totalStrengthHistory(
  exercises: Exercise[],
  sets: ExerciseSet[],
): ProgressPoint[] {
  const loadExerciseIds = new Set(
    exercises.filter((e) => e.tracks_load).map((e) => e.id),
  );
  const relevant = sets.filter(
    (s) => loadExerciseIds.has(s.exercise_id) && s.weight_kg != null,
  );
  const dates = [...new Set(relevant.map((s) => s.session_date))].sort();

  const bestByExercise = new Map<string, number>();
  return dates.map((date) => {
    for (const s of relevant) {
      if (s.session_date !== date) continue;
      const oneRm = estimatedOneRepMax(s.weight_kg!, s.reps);
      const prevBest = bestByExercise.get(s.exercise_id) ?? 0;
      if (oneRm > prevBest) bestByExercise.set(s.exercise_id, oneRm);
    }
    const value = [...bestByExercise.values()].reduce((sum, v) => sum + v, 0);
    return { date, value };
  });
}

export type MuscleGroupVolume = { muscleGroup: MuscleGroup; setsCount: number };

/** Sets logged per muscle group, over the last `weeks` weeks (all 7
 * groups always present, zero-filled, so the chart never re-shapes). */
export function setsPerMuscleGroup(
  exercises: Exercise[],
  sets: ExerciseSet[],
  weeks = 8,
): MuscleGroupVolume[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const exerciseToGroup = new Map(exercises.map((e) => [e.id, e.muscle_group]));
  const counts = new Map<MuscleGroup, number>();
  for (const s of sets) {
    if (s.session_date < cutoffDate) continue;
    const group = exerciseToGroup.get(s.exercise_id);
    if (!group) continue;
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return MUSCLE_GROUPS.map((m) => ({
    muscleGroup: m.value,
    setsCount: counts.get(m.value) ?? 0,
  }));
}

export type PlateauExercise = { exerciseId: string; exerciseName: string };

/** Flags exercises whose last `minSessions` sessions show no improvement
 * (each no better than the one before) in progressHistory's own metric
 * (volume, or reps for exercises that don't track load). Needs at least
 * that many sessions logged to say anything either way. */
export function plateauExercises(
  exercises: Exercise[],
  sets: ExerciseSet[],
  minSessions = 3,
): PlateauExercise[] {
  const results: PlateauExercise[] = [];
  for (const exercise of exercises) {
    const exerciseSets = sets.filter((s) => s.exercise_id === exercise.id);
    const history = progressHistory(exerciseSets, exercise.tracks_load);
    if (history.length < minSessions) continue;

    const lastN = history.slice(-minSessions);
    const isFlat = lastN.every((p, i) => i === 0 || p.value <= lastN[i - 1].value);
    if (isFlat) {
      results.push({ exerciseId: exercise.id, exerciseName: exercise.name });
    }
  }
  return results;
}

/** Monday-start ISO week key for a YYYY-MM-DD date string. */
export function isoWeekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

/** Distinct workout days per distinct (Monday-start) week that had at
 * least one, averaged — i.e. "how many sessions in a typical active
 * week", not diluted by weeks with no training logged at all. */
export function averageSessionsPerWeek(sets: ExerciseSet[]): number {
  const uniqueDates = [...new Set(sets.map((s) => s.session_date))];
  if (uniqueDates.length === 0) return 0;

  const sessionsPerWeek = new Map<string, number>();
  for (const date of uniqueDates) {
    const week = isoWeekStart(date);
    sessionsPerWeek.set(week, (sessionsPerWeek.get(week) ?? 0) + 1);
  }

  return uniqueDates.length / sessionsPerWeek.size;
}

/** Most recent session_date across every set, or null if there's none. */
export function lastSessionDate(sets: ExerciseSet[]): string | null {
  if (sets.length === 0) return null;
  return sets.reduce(
    (latest, s) => (s.session_date > latest ? s.session_date : latest),
    sets[0].session_date,
  );
}

/** Total sets logged since this (Monday-start) week began. */
export function setsThisWeek(sets: ExerciseSet[]): number {
  const monday = isoWeekStart(todayISO());
  return sets.filter((s) => s.session_date >= monday).length;
}

/** Distinct workout days logged since this (Monday-start) week began. */
export function sessionsThisWeek(sets: ExerciseSet[]): number {
  const monday = isoWeekStart(todayISO());
  const datesThisWeek = new Set(
    sets.filter((s) => s.session_date >= monday).map((s) => s.session_date),
  );
  return datesThisWeek.size;
}
