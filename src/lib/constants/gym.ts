/**
 * Fixed, pre-defined lists for the Gym module. Values must match the
 * Postgres enums in supabase/migrations (`muscle_group`, `execution_type`,
 * `set_difficulty`) — closed lists, not free text, so progress charts and
 * future aggregations stay consistent.
 */

// icon is a hand-drawn body-silhouette diagram (MuscleGroupIcon), not an
// emoji field here — it keys off `value` directly, so there's nothing to
// list per entry.
//
// quads/hamstrings/glutes/lats/traps/forearms/calves are more granular
// options alongside the original broad groups (never a replacement for
// them) — for anyone who splits e.g. leg training across several days
// instead of one single "Legs" day. Pick whichever granularity fits
// your own split; nothing forces one or the other.
export const MUSCLE_GROUPS = [
  { value: "back", label: "Back", tint: "bg-orange-500/15", barTint: "bg-orange-500" },
  { value: "chest", label: "Chest", tint: "bg-blue-500/15", barTint: "bg-blue-500" },
  { value: "legs", label: "Legs", tint: "bg-emerald-500/15", barTint: "bg-emerald-500" },
  { value: "shoulders", label: "Shoulders", tint: "bg-purple-500/15", barTint: "bg-purple-500" },
  { value: "biceps", label: "Biceps", tint: "bg-pink-500/15", barTint: "bg-pink-500" },
  { value: "triceps", label: "Triceps", tint: "bg-cyan-500/15", barTint: "bg-cyan-500" },
  { value: "core", label: "Core", tint: "bg-amber-500/15", barTint: "bg-amber-500" },
  { value: "quads", label: "Quads", tint: "bg-lime-500/15", barTint: "bg-lime-500" },
  { value: "hamstrings", label: "Hamstrings", tint: "bg-teal-500/15", barTint: "bg-teal-500" },
  { value: "glutes", label: "Glutes", tint: "bg-fuchsia-500/15", barTint: "bg-fuchsia-500" },
  { value: "lats", label: "Lats", tint: "bg-sky-500/15", barTint: "bg-sky-500" },
  { value: "traps", label: "Traps", tint: "bg-violet-500/15", barTint: "bg-violet-500" },
  { value: "forearms", label: "Forearms", tint: "bg-rose-500/15", barTint: "bg-rose-500" },
  { value: "calves", label: "Calves", tint: "bg-indigo-500/15", barTint: "bg-indigo-500" },
] as const;

export const EXECUTION_TYPES = [
  { value: "straight", label: "Straight" },
  { value: "mini_pause", label: "Mini-pause" },
  { value: "rest_pause", label: "Rest-pause" },
] as const;

export const DIFFICULTIES = [
  {
    value: "easy",
    label: "Easy",
    tint: "bg-emerald-500/15 text-emerald-300",
    border: "border-emerald-700 bg-emerald-500/10 text-emerald-400",
  },
  {
    value: "medium",
    label: "Medium",
    tint: "bg-amber-500/15 text-amber-300",
    border: "border-amber-700 bg-amber-500/10 text-amber-400",
  },
  {
    value: "hard",
    label: "Hard",
    tint: "bg-red-500/15 text-red-300",
    border: "border-red-700 bg-red-500/10 text-red-400",
  },
] as const;

/** What the exercise's numeric target/log (`reps`) actually counts —
 * repetitions for most exercises, but a plank/dead-hang/wall-sit is timed
 * instead. `shortLabel` is what's appended straight onto a number (e.g.
 * "45s"); `label` is the full word used in forms/dropdowns. */
export const EXERCISE_UNITS = [
  { value: "reps", label: "Reps", shortLabel: "reps" },
  { value: "seconds", label: "Seconds", shortLabel: "s" },
] as const;

/** Sentinel value for "create a new routine" in the exercise form's
 * routine picker — never a real routine id, so it can't collide. */
export const NEW_ROUTINE = "__new__";

/** Lifetime cumulative-volume milestones (kg ever lifted, load-tracking
 * exercises only) — spaced so a new lifter sees the first one fairly
 * soon, and someone training for years still has one ahead of them. */
export const VOLUME_MILESTONES_KG = [
  10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]["value"];
export type MuscleGroupOption = (typeof MUSCLE_GROUPS)[number];
export type ExecutionType = (typeof EXECUTION_TYPES)[number]["value"];
export type SetDifficulty = (typeof DIFFICULTIES)[number]["value"];
export type ExerciseUnit = (typeof EXERCISE_UNITS)[number]["value"];
