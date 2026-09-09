"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exerciseSchema, setLogSchema } from "@/lib/validation/gym";
import type { PendingSet } from "@/components/gym/session-context";
import { NEW_ROUTINE, type MuscleGroup } from "@/lib/constants/gym";
import type { TablesInsert } from "@/lib/supabase/database.types";

export type GymFormResult =
  | { status: "error"; message: string }
  | { status: "success" }
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
    reps: formData.get("reps"),
    tracksLoad: formData.get("tracksLoad") === "on",
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
    tracks_load: parsed.data.tracksLoad,
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
    reps: formData.get("reps"),
    tracksLoad: formData.get("tracksLoad") === "on",
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
      tracks_load: parsed.data.tracksLoad,
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

  const sessionDate = new Date().toISOString().slice(0, 10);
  const rows: Omit<TablesInsert<"exercise_sets">, "user_id">[] = [];
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const { error } = await supabase
    .from("exercise_sets")
    .upsert(
      rows.map((row) => ({ ...row, user_id: user.id })),
      { onConflict: "exercise_id,session_date,set_number" },
    );
  if (error) return { status: "error", message: error.message };

  revalidatePath(`/dashboard/gym/${muscleGroup}`);
  return { status: "success" };
}
