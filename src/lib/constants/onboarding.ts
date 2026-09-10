/**
 * Fixed, pre-defined onboarding choices. `value`/`label` must match the
 * Postgres enums in supabase/migrations (`modality`, `training_goal`) —
 * kept as closed lists rather than free text, so dashboards/aggregations
 * built on top stay consistent. `icon`/`tint` are purely presentational,
 * reused everywhere a sport/goal shows up (nav, onboarding, settings) so
 * the same emoji+color always means the same thing.
 */

export const MODALITIES = [
  {
    value: "gym",
    label: "Gym",
    icon: "🏋️",
    tint: "bg-linear-to-br from-orange-500/30 to-orange-500/5",
  },
  {
    value: "swimming",
    label: "Swimming",
    icon: "🏊",
    tint: "bg-linear-to-br from-blue-500/30 to-blue-500/5",
  },
  {
    value: "running",
    label: "Running",
    icon: "🏃",
    tint: "bg-linear-to-br from-emerald-500/30 to-emerald-500/5",
  },
] as const;

export const TRAINING_GOALS = [
  { value: "build_muscle", label: "Build muscle / strength", icon: "💪" },
  { value: "lose_weight", label: "Lose weight / fat", icon: "🔥" },
  { value: "improve_endurance", label: "Improve endurance", icon: "⚡" },
  { value: "general_fitness", label: "General health & fitness", icon: "🌱" },
  { value: "performance", label: "Improve performance / competition", icon: "🏆" },
] as const;

export type Modality = (typeof MODALITIES)[number]["value"];
export type TrainingGoal = (typeof TRAINING_GOALS)[number]["value"];
export type ModalityOption = (typeof MODALITIES)[number];
