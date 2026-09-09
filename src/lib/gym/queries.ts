import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { MuscleGroup } from "@/lib/constants/gym";

export type Exercise = Tables<"exercises">;
export type ExerciseSet = Tables<"exercise_sets">;

export const getExercises = cache(
  async (userId: string, muscleGroup: MuscleGroup) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .eq("user_id", userId)
      .eq("muscle_group", muscleGroup)
      .order("created_at", { ascending: true });
    return data ?? [];
  },
);

/** Which muscle groups the user has at least one exercise in — drives the
 * quick-switch tabs on the muscle group page. */
export const getMuscleGroupsWithExercises = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("muscle_group")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.muscle_group));
});

export const getExerciseSets = cache(async (exerciseId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_sets")
    .select("*")
    .eq("exercise_id", exerciseId)
    .order("session_date", { ascending: true })
    .order("set_number", { ascending: true });
  return data ?? [];
});

/** Every exercise the user has, across all muscle groups — for the
 * cross-cutting Statistics page. */
export const getAllExercises = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
});

/** Every logged set the user has, across all exercises — exercise_sets
 * carries its own user_id, so this doesn't need a join. */
export const getAllExerciseSets = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_sets")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: true });
  return data ?? [];
});
