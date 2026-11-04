"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exerciseSchema, setLogSchema } from "@/lib/validation/gym";
import type { PendingSet } from "@/components/gym/session-context";
import { NEW_ROUTINE, type MuscleGroup } from "@/lib/constants/gym";

export type PrAchieved = {
  exerciseName: string;
  weightKg: number;
  reps: number;
  oneRepMax: number;
};

export type GymFormResult =
  | { status: "error"; message: string }
  | {
      status: "success";
      warning?: string;
      /** New personal bests this save produced, one per exercise —
       * surfaced as a small celebration in the UI. */
      prs?: PrAchieved[];
      /** Lifetime-volume thresholds (kg) newly crossed by this save. */
      milestonesKg?: number[];
    }
  | null;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Shared by create and edit: resolves the form's routineId to a real
 * routine id, creating a new routine first if "+ Create new workout"
 * was picked. */
async function resolveRoutineId(
  supabase: SupabaseServerClient,
  userId: string,
  muscleGroup: MuscleGroup,
  routineId: string,
  newRoutineName: string | undefined,
): Promise<{ routineId: string } | { error: string }> {
  if (routineId !== NEW_ROUTINE) return { routineId };

  const { data: routine, error } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      muscle_group: muscleGroup,
      name: newRoutineName!.trim(),
    })
    .select()
    .single();
  if (error || !routine) {
    return { error: error?.message ?? "Could not create the workout." };
  }
  return { routineId: routine.id };
}

export async function createExerciseAction(
  _prevState: GymFormResult,
  formData: FormData,
): Promise<GymFormResult> {
  const parsed = exerciseSchema.safeParse({
    muscleGroup: formData.get("muscleGroup"),
    routineId: formData.get("routineId"),
    newRoutineName: formData.get("newRoutineName") ?? undefined,
    name: formData.get("name"),
    sets: formData.get("sets"),
    unit: formData.get("unit"),
    reps: formData.get("reps"),
    tracksLoad: formData.get("tracksLoad") === "on",
    track1rm: formData.get("track1rm") === "on",
    addsBodyweight: formData.get("addsBodyweight") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const resolved = await resolveRoutineId(
    supabase,
    user.id,
    parsed.data.muscleGroup,
    parsed.data.routineId,
    parsed.data.newRoutineName,
  );
  if ("error" in resolved) return { status: "error", message: resolved.error };

  const { error } = await supabase.from("exercises").insert({
    user_id: user.id,
    muscle_group: parsed.data.muscleGroup,
    routine_id: resolved.routineId,
    name: parsed.data.name,
    sets: parsed.data.sets,
    reps: parsed.data.reps,
    unit: parsed.data.unit,
    tracks_load: parsed.data.tracksLoad,
    track_1rm: parsed.data.track1rm,
    adds_bodyweight: parsed.data.addsBodyweight,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath(`/dashboard/gym/${parsed.data.muscleGroup}`);
  return { status: "success" };
}

export async function updateExerciseAction(
  exerciseId: string,
  _prevState: GymFormResult,
  formData: FormData,
): Promise<GymFormResult> {
  const parsed = exerciseSchema.safeParse({
    muscleGroup: formData.get("muscleGroup"),
    routineId: formData.get("routineId"),
    newRoutineName: formData.get("newRoutineName") ?? undefined,
    name: formData.get("name"),
    sets: formData.get("sets"),
    unit: formData.get("unit"),
    reps: formData.get("reps"),
    tracksLoad: formData.get("tracksLoad") === "on",
    track1rm: formData.get("track1rm") === "on",
    addsBodyweight: formData.get("addsBodyweight") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  // Editing can move the exercise to a different (or brand new) workout
  // now — users may reorganize mid-way through tracking.
  const resolved = await resolveRoutineId(
    supabase,
    user.id,
    parsed.data.muscleGroup,
    parsed.data.routineId,
    parsed.data.newRoutineName,
  );
  if ("error" in resolved) return { status: "error", message: resolved.error };

  const { error } = await supabase
    .from("exercises")
    .update({
      routine_id: resolved.routineId,
      name: parsed.data.name,
      sets: parsed.data.sets,
      reps: parsed.data.reps,
      unit: parsed.data.unit,
      tracks_load: parsed.data.tracksLoad,
      track_1rm: parsed.data.track1rm,
      adds_bodyweight: parsed.data.addsBodyweight,
    })
    .eq("id", exerciseId)
    .eq("user_id", user.id);
  if (error) return { status: "error", message: error.message };

  revalidatePath(`/dashboard/gym/${parsed.data.muscleGroup}`);
  return { status: "success" };
}

/** Persists a new exercise order within one routine after a drag —
 * called directly from the client (not a <form>), so no return-state
 * plumbing is needed; the UI already reordered itself optimistically. */
export async function reorderExercisesAction(
  routineId: string,
  muscleGroup: MuscleGroup,
  orderedExerciseIds: string[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all(
    orderedExerciseIds.map((id, index) =>
      supabase
        .from("exercises")
        .update({ position: index })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("routine_id", routineId),
    ),
  );

  revalidatePath(`/dashboard/gym/${muscleGroup}`);
}

/** Also called directly from the client, from the inline rename field. */
export async function renameRoutineAction(
  routineId: string,
  muscleGroup: MuscleGroup,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("routines")
    .update({ name: trimmed })
    .eq("id", routineId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/gym/${muscleGroup}`);
}

/** Marks a plateaued exercise as "handled" — the Deload Analysis card
 * drops it until a fresh set gets logged for it (see
 * lib/gym/derive.ts's deloadExercises for the comparison). Upserts
 * rather than inserts: re-acknowledging just bumps the timestamp. */
export async function acknowledgeDeloadAction(exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("deload_acknowledgements").upsert(
    {
      user_id: user.id,
      exercise_id: exerciseId,
      acknowledged_at: new Date().toISOString(),
    },
    { onConflict: "user_id,exercise_id" },
  );

  revalidatePath("/dashboard/statistics");
}

export async function deleteExerciseAction(formData: FormData) {
  const exerciseId = formData.get("exerciseId");
  const muscleGroup = formData.get("muscleGroup");
  if (typeof exerciseId !== "string" || typeof muscleGroup !== "string") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/gym/${muscleGroup}`);
}

/** What save_gym_session (supabase/migrations/20261104000000_...) returns. */
type SaveGymSessionResult = {
  saved_count: number;
  stale_count: number;
  prs: { exercise_name: string; weight_kg: number; reps: number; one_rep_max: number }[];
  milestones_kg: number[];
};

/**
 * Flushes every set staged in the client-side WorkoutSessionProvider for
 * this muscle group. Validation of the input shape stays here (Zod);
 * everything that needs the user's history — ownership check, PR and
 * volume-milestone detection, and the writes themselves — happens inside
 * the save_gym_session Postgres function, in one transaction.
 */
export async function saveSessionAction(
  muscleGroup: MuscleGroup,
  pending: Record<string, PendingSet>,
  // useActionState requires this (prevState, formData) shape, but this
  // action's real input is bound in (muscleGroup, pending) — neither is
  // used here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: GymFormResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<GymFormResult> {
  const entries = Object.entries(pending);
  if (entries.length === 0) {
    return { status: "error", message: "Log at least one set first." };
  }

  const sets = [];
  for (const [key, value] of entries) {
    const [exerciseId, setNumberRaw] = key.split(":");
    const parsed = setLogSchema.safeParse({
      exerciseId,
      setNumber: setNumberRaw,
      weightKg: value.weightKg,
      reps: value.reps,
      executionType: value.executionType,
      difficulty: value.difficulty,
    });
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0].message };
    }
    sets.push({
      exercise_id: parsed.data.exerciseId,
      set_number: parsed.data.setNumber,
      weight_kg: parsed.data.weightKg,
      reps: parsed.data.reps,
      execution_type: parsed.data.executionType,
      difficulty: parsed.data.difficulty,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const sessionDate = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc("save_gym_session", {
    p_muscle_group: muscleGroup,
    p_session_date: sessionDate,
    p_sets: sets,
  });
  if (error) return { status: "error", message: error.message };

  const result = data as unknown as SaveGymSessionResult;

  if (result.saved_count === 0) {
    return {
      status: "error",
      message: "Those exercises no longer exist — refresh the page and try again.",
    };
  }

  const prs: PrAchieved[] = result.prs.map((pr) => ({
    exerciseName: pr.exercise_name,
    weightKg: Number(pr.weight_kg),
    reps: pr.reps,
    oneRepMax: Number(pr.one_rep_max),
  }));
  const milestonesKg = result.milestones_kg.map(Number);
  const staleCount = result.stale_count;

  revalidatePath(`/dashboard/gym/${muscleGroup}`);
  if (prs.length > 0 || milestonesKg.length > 0) {
    revalidatePath("/dashboard/achievements");
  }

  return {
    status: "success",
    ...(staleCount > 0 && {
      warning: `${staleCount} set${staleCount === 1 ? "" : "s"} referenced an exercise that no longer exists and ${staleCount === 1 ? "was" : "were"} skipped.`,
    }),
    ...(prs.length > 0 && { prs }),
    ...(milestonesKg.length > 0 && { milestonesKg }),
  };
}