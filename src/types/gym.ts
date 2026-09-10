import type { Tables } from "@/types/database.types";

/** Domain row types for the Gym module, shared across queries, actions,
 * derive.ts and the components that render them — one place to look for
 * "what shape is an exercise/set/routine", instead of scattered
 * definitions per file. */
export type Exercise = Tables<"exercises">;
export type ExerciseSet = Tables<"exercise_sets">;
export type Routine = Tables<"routines">;
