"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exerciseSchema, setLogSchema } from "@/lib/validation/gym";

export type GymFormResult =
  | { status: "error"; message: string }
  | { status: "success" }
  | null;

export async function createExerciseAction(
  _prevState: GymFormResult,
  formData: FormData,
): Promise<GymFormResult> {
  const parsed = exerciseSchema.safeParse({
    muscleGroup: formData.get("muscleGroup"),
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

  const { error } = await supabase.from("exercises").insert({
    user_id: user.id,
    muscle_group: parsed.data.muscleGroup,
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

  const { error } = await supabase
    .from("exercises")
    .update({
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

export async function saveSetAction(
  _prevState: GymFormResult,
  formData: FormData,
): Promise<GymFormResult> {
  const weightRaw = formData.get("weightKg");
  const weightKg =
    weightRaw !== null && weightRaw !== "" ? Number(weightRaw) : null;

  const parsed = setLogSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    setNumber: formData.get("setNumber"),
    weightKg,
    reps: formData.get("reps"),
    executionType: formData.get("executionType"),
    difficulty: formData.get("difficulty"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const { error } = await supabase.from("exercise_sets").upsert(
    {
      user_id: user.id,
      exercise_id: parsed.data.exerciseId,
      session_date: new Date().toISOString().slice(0, 10),
      set_number: parsed.data.setNumber,
      weight_kg: parsed.data.weightKg,
      reps: parsed.data.reps,
      execution_type: parsed.data.executionType,
      difficulty: parsed.data.difficulty,
    },
    { onConflict: "exercise_id,session_date,set_number" },
  );
  if (error) return { status: "error", message: error.message };

  const muscleGroup = formData.get("muscleGroup");
  if (typeof muscleGroup === "string") {
    revalidatePath(`/dashboard/gym/${muscleGroup}`);
  }
  return { status: "success" };
}
