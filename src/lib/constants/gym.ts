/**
 * Fixed, pre-defined lists for the Gym module. Values must match the
 * Postgres enums in supabase/migrations (`muscle_group`, `execution_type`,
 * `set_difficulty`) — closed lists, not free text, so progress charts and
 * future aggregations stay consistent.
 */

export const MUSCLE_GROUPS = [
  { value: "back", label: "Back", icon: "🦾", tint: "bg-orange-500/15", barTint: "bg-orange-500" },
  { value: "chest", label: "Chest", icon: "🫀", tint: "bg-blue-500/15", barTint: "bg-blue-500" },
  { value: "legs", label: "Legs", icon: "🦵", tint: "bg-emerald-500/15", barTint: "bg-emerald-500" },
  { value: "shoulders", label: "Shoulders", icon: "🤷", tint: "bg-purple-500/15", barTint: "bg-purple-500" },
  { value: "biceps", label: "Biceps", icon: "💪", tint: "bg-pink-500/15", barTint: "bg-pink-500" },
  { value: "triceps", label: "Triceps", icon: "🔱", tint: "bg-cyan-500/15", barTint: "bg-cyan-500" },
  { value: "core", label: "Core", icon: "🎯", tint: "bg-amber-500/15", barTint: "bg-amber-500" },
] as const;

export const EXECUTION_TYPES = [
  { value: "straight", label: "Straight" },
  { value: "mini_pause", label: "Mini-pause" },
  { value: "rest_pause", label: "Rest-pause" },
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Easy", tint: "bg-emerald-500/15 text-emerald-300" },
  { value: "medium", label: "Medium", tint: "bg-amber-500/15 text-amber-300" },
  { value: "hard", label: "Hard", tint: "bg-red-500/15 text-red-300" },
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]["value"];
export type MuscleGroupOption = (typeof MUSCLE_GROUPS)[number];
export type ExecutionType = (typeof EXECUTION_TYPES)[number]["value"];
export type SetDifficulty = (typeof DIFFICULTIES)[number]["value"];
