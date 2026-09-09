/**
 * Fixed, pre-defined onboarding choices. Values must match the Postgres
 * enums in supabase/migrations (`modality`, `training_goal`) — kept as
 * closed lists rather than free text, so dashboards/aggregations built on
 * top stay consistent.
 */

export const MODALITIES = [
  { value: "gym", label: "Gym" },
  { value: "swimming", label: "Swimming" },
  { value: "running", label: "Running" },
] as const;

export const TRAINING_GOALS = [
  { value: "build_muscle", label: "Build muscle / strength" },
  { value: "lose_weight", label: "Lose weight / fat" },
  { value: "improve_endurance", label: "Improve endurance" },
  { value: "general_fitness", label: "General health & fitness" },
  { value: "performance", label: "Improve performance / competition" },
] as const;

export type Modality = (typeof MODALITIES)[number]["value"];
export type TrainingGoal = (typeof TRAINING_GOALS)[number]["value"];
export type ModalityOption = (typeof MODALITIES)[number];
