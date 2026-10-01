"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exerciseSchema, setLogSchema } from "@/lib/validation/gym";
import type { PendingSet } from "@/components/gym/session-context";
import { NEW_ROUTINE, VOLUME_MILESTONES_KG, type MuscleGroup } from "@/lib/constants/gym";
import type { TablesInsert } from "@/types/database.types";
import { getAllExercises, getAllExerciseSets } from "@/lib/gym/queries";
import { estimatedOneRepMax, totalVolumeEver } from "@/lib/gym/derive";

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

/**
 * Flushes every set staged in the client-side WorkoutSessionProvider for
 * this muscle group in one upsert — nothing before this point ever
 * touched the database, so a single "Save session" click is what makes
 * the whole visit's sets real (and countable in the progress charts).
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  // Two different scopes needed here: this muscle group's own exercises,
  // to validate what's being saved (same as before); and the user's
  // *entire* history, since PRs and lifetime-volume milestones are
  // account-wide, not scoped to one muscle group.
  const [{ data: groupExercises }, allExercises, allSets] = await Promise.all([
    supabase.from("exercises").select("id").eq("user_id", user.id).eq("muscle_group", muscleGroup),
    getAllExercises(user.id),
    getAllExerciseSets(user.id),
  ]);

  // Guard against stale client-side state — a set staged for an exercise
  // that's since been deleted (or restored from an older backgrounded-tab
  // localStorage backup) would otherwise hit the exercise_id foreign key
  // and fail the whole batch with a raw Postgres error. Drop only the
  // stale entries and save everything still valid instead.
  const validExerciseIds = new Set((groupExercises ?? []).map((e) => e.id));

  const sessionDate = new Date().toISOString().slice(0, 10);
  const rows: Omit<TablesInsert<"exercise_sets">, "user_id">[] = [];
  let staleCount = 0;
  for (const [key, value] of entries) {
    const [exerciseId, setNumberRaw] = key.split(":");
    if (!validExerciseIds.has(exerciseId)) {
      staleCount++;
      continue;
    }
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
    rows.push({
      exercise_id: parsed.data.exerciseId,
      session_date: sessionDate,
      set_number: parsed.data.setNumber,
      weight_kg: parsed.data.weightKg,
      reps: parsed.data.reps,
      execution_type: parsed.data.executionType,
      difficulty: parsed.data.difficulty,
    });
  }

  if (rows.length === 0) {
    return {
      status: "error",
      message: "Those exercises no longer exist — refresh the page and try again.",
    };
  }

  // --- Work out PRs and volume milestones from the history as it stood
  // BEFORE this save, so a set can only ever PR against what actually
  // came before it. Only load-tracking, rep-counted exercises are
  // eligible — same rule the 1RM/Total Strength stats already use, since
  // Epley's formula and a plain volume figure both assume a rep count. ---
  const exerciseById = new Map(allExercises.map((e) => [e.id, e]));
  const isPrEligible = (exerciseId: string) => {
    const exercise = exerciseById.get(exerciseId);
    return !!exercise && exercise.tracks_load && exercise.unit === "reps";
  };

  const priorBestByExercise = new Map<string, number>();
  for (const s of allSets) {
    if (!isPrEligible(s.exercise_id) || s.weight_kg == null) continue;
    const oneRm = estimatedOneRepMax(s.weight_kg, s.reps);
    if (oneRm > (priorBestByExercise.get(s.exercise_id) ?? 0)) {
      priorBestByExercise.set(s.exercise_id, oneRm);
    }
  }

  const bestNewByExercise = new Map<
    string,
    { weightKg: number; reps: number; oneRepMax: number }
  >();
  for (const row of rows) {
    if (!isPrEligible(row.exercise_id) || row.weight_kg == null) continue;
    const oneRm = estimatedOneRepMax(row.weight_kg, row.reps);
    const current = bestNewByExercise.get(row.exercise_id);
    if (!current || oneRm > current.oneRepMax) {
      bestNewByExercise.set(row.exercise_id, {
        weightKg: row.weight_kg,
        reps: row.reps,
        oneRepMax: oneRm,
      });
    }
  }

  const prRows: Omit<TablesInsert<"exercise_prs">, "user_id">[] = [];
  const prsAchieved: PrAchieved[] = [];
  for (const [exerciseId, best] of bestNewByExercise) {
    if (best.oneRepMax <= (priorBestByExercise.get(exerciseId) ?? 0)) continue;
    prRows.push({
      exercise_id: exerciseId,
      session_date: sessionDate,
      weight_kg: best.weightKg,
      reps: best.reps,
      one_rep_max: best.oneRepMax,
    });
    prsAchieved.push({
      exerciseName: exerciseById.get(exerciseId)?.name ?? "Exercise",
      weightKg: best.weightKg,
      reps: best.reps,
      oneRepMax: best.oneRepMax,
    });
  }

  const priorVolume = totalVolumeEver(allExercises, allSets);
  const newVolume = rows.reduce((sum, row) => {
    if (!isPrEligible(row.exercise_id) || row.weight_kg == null) return sum;
    return sum + row.weight_kg * row.reps;
  }, 0);
  const totalVolumeAfter = priorVolume + newVolume;
  const milestonesCrossed = VOLUME_MILESTONES_KG.filter(
    (threshold) => priorVolume < threshold && totalVolumeAfter >= threshold,
  );

  // --- Only now write anything — everything above was read-only. ---
  const { error } = await supabase
    .from("exercise_sets")
    .upsert(
      rows.map((row) => ({ ...row, user_id: user.id })),
      { onConflict: "exercise_id,session_date,set_number" },
    );
  if (error) return { status: "error", message: error.message };

  // Best-effort: the sets themselves already saved above, so a hiccup
  // recording an achievement shouldn't turn a real, successful save into
  // an error.
  if (prRows.length > 0) {
    await supabase
      .from("exercise_prs")
      .insert(prRows.map((pr) => ({ ...pr, user_id: user.id })));
  }
  if (milestonesCrossed.length > 0) {
    await supabase.from("volume_milestones").upsert(
      milestonesCrossed.map((threshold) => ({
        user_id: user.id,
        threshold_kg: threshold,
        achieved_at: sessionDate,
      })),
      { onConflict: "user_id,threshold_kg", ignoreDuplicates: true },
    );
  }

  revalidatePath(`/dashboard/gym/${muscleGroup}`);
  if (prRows.length > 0 || milestonesCrossed.length > 0) {
    revalidatePath("/dashboard/achievements");
  }

  return {
    status: "success",
    ...(staleCount > 0 && {
      warning: `${staleCount} set${staleCount === 1 ? "" : "s"} referenced an exercise that no longer exists and ${staleCount === 1 ? "was" : "were"} skipped.`,
    }),
    ...(prsAchieved.length > 0 && { prs: prsAchieved }),
    ...(milestonesCrossed.length > 0 && { milestonesKg: [...milestonesCrossed] }),
  };
}
