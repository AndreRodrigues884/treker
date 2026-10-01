import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MuscleGroup } from "@/lib/constants/gym";

// Row types (Exercise/ExerciseSet/Routine) now live in src/types/gym.ts —
// import them from there, not from here.

/** Named groups of exercises that share one progress chart — e.g. two
 * different Leg days end up as two routines, each with its own chart. */
export const getRoutines = cache(
  async (userId: string, muscleGroup: MuscleGroup) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", userId)
      .eq("muscle_group", muscleGroup)
      .order("created_at", { ascending: true });
    return data ?? [];
  },
);

export const getExercises = cache(
  async (userId: string, muscleGroup: MuscleGroup) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .eq("user_id", userId)
      .eq("muscle_group", muscleGroup)
      .order("position", { ascending: true });
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

/** Every set for a batch of exercises, in one query — use this instead of
 * calling getExerciseSets() in a loop (an N+1 round-trip per exercise is
 * exactly what made switching muscle groups feel slow). Group the result
 * by exercise_id locally. */
export const getExerciseSetsForExercises = cache(
  async (exerciseIds: string[]) => {
    if (exerciseIds.length === 0) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("exercise_sets")
      .select("*")
      .in("exercise_id", exerciseIds)
      .order("session_date", { ascending: true })
      .order("set_number", { ascending: true });
    return data ?? [];
  },
);

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

/** Every personal record ever detected for this user, most recent first
 * — the Achievements page's PR history. Exercise names aren't joined in
 * here (same convention as everywhere else in this module — fetch
 * exercises separately and look up by id), since an exercise can be
 * renamed or deleted after the PR was set. */
export const getExercisePrs = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_prs")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
});

/** Every lifetime-volume milestone this user has crossed, in order. */
export const getVolumeMilestones = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("volume_milestones")
    .select("*")
    .eq("user_id", userId)
    .order("threshold_kg", { ascending: true });
  return data ?? [];
});

/** One row per exercise the user has ever dismissed from Deload
 * Analysis — small, fetched in full, same reasoning as the other
 * per-user gym lookups. */
export const getDeloadAcknowledgements = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deload_acknowledgements")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
});
