"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { swimTimeSchema } from "@/lib/validation/swimming";
import type { SwimStroke } from "@/lib/constants/swimming";

export type SwimFormResult =
  | { status: "error"; message: string }
  | { status: "success" }
  | null;

/** Every logged time is its own row/attempt — training often means
 * repeating the same event several times in one session (e.g. 3x 50m
 * freestyle), and each of those is a real, separate data point, not a
 * single value to overwrite for the day. */
export async function logSwimTimeAction(
  _prevState: SwimFormResult,
  formData: FormData,
): Promise<SwimFormResult> {
  const parsed = swimTimeSchema.safeParse({
    stroke: formData.get("stroke"),
    distanceM: formData.get("distanceM"),
    minutes: formData.get("minutes"),
    seconds: formData.get("seconds"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const timeSeconds = parsed.data.minutes * 60 + parsed.data.seconds;

  const { error } = await supabase.from("swim_times").insert({
    user_id: user.id,
    stroke: parsed.data.stroke,
    distance_m: parsed.data.distanceM,
    time_seconds: timeSeconds,
    session_date: new Date().toISOString().slice(0, 10),
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/dashboard/swimming");
  return { status: "success" };
}

/** A goal is a single current value, not a log — re-submitting for the
 * same (stroke, distance) replaces it (upsert), unlike swim_times.
 * Called directly from a client component via useTransition, same
 * plain-action convention as renameRoutineAction, rather than
 * useActionState — there's no multi-field form state to track here. */
export async function setSwimGoalAction(
  stroke: SwimStroke,
  distanceM: number,
  minutes: number,
  seconds: number,
) {
  const targetSeconds = minutes * 60 + seconds;
  if (!(targetSeconds > 0)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("swim_goals").upsert(
    {
      user_id: user.id,
      stroke,
      distance_m: distanceM,
      target_seconds: targetSeconds,
    },
    { onConflict: "user_id,stroke,distance_m" },
  );

  revalidatePath("/dashboard/swimming");
}

export async function clearSwimGoalAction(stroke: SwimStroke, distanceM: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("swim_goals")
    .delete()
    .eq("user_id", user.id)
    .eq("stroke", stroke)
    .eq("distance_m", distanceM);

  revalidatePath("/dashboard/swimming");
}
