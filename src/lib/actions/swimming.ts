"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { swimTimeSchema } from "@/lib/validation/swimming";
import type { SwimStroke } from "@/lib/constants/swimming";
import { getSwimTimes } from "@/lib/swimming/queries";
import { bestSwimTime } from "@/lib/swimming/derive";

export type SwimPrAchieved = {
  stroke: SwimStroke;
  distanceM: number;
  timeSeconds: number;
};

export type SwimFormResult =
  | { status: "error"; message: string }
  | { status: "success"; pr?: SwimPrAchieved }
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
  const sessionDate = new Date().toISOString().slice(0, 10);
  const event = { stroke: parsed.data.stroke, distanceM: parsed.data.distanceM };

  // --- Work out whether this is a new PR from the history as it stood
  // BEFORE this save, so a time can only ever PR against what actually
  // came before it, same reasoning as Gym's saveSessionAction. ---
  const priorTimes = await getSwimTimes(user.id);
  const priorBest = bestSwimTime(priorTimes, event) ?? Infinity;
  const isPr = timeSeconds < priorBest;

  const { error } = await supabase.from("swim_times").insert({
    user_id: user.id,
    stroke: parsed.data.stroke,
    distance_m: parsed.data.distanceM,
    time_seconds: timeSeconds,
    session_date: sessionDate,
  });
  if (error) return { status: "error", message: error.message };

  // Best-effort: the time itself already saved above, so a hiccup
  // recording a PR shouldn't turn a real, successful save into an error.
  if (isPr) {
    await supabase.from("swim_prs").insert({
      user_id: user.id,
      stroke: parsed.data.stroke,
      distance_m: parsed.data.distanceM,
      time_seconds: timeSeconds,
      session_date: sessionDate,
    });
  }

  revalidatePath("/dashboard/swimming");
  if (isPr) revalidatePath("/dashboard/achievements");

  return {
    status: "success",
    ...(isPr && {
      pr: { stroke: parsed.data.stroke, distanceM: parsed.data.distanceM, timeSeconds },
    }),
  };
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
