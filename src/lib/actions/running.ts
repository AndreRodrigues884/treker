"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runSchema } from "@/lib/validation/running";
import { getRuns } from "@/lib/running/queries";
import { matchStandardDistance, pace, runsForDistance } from "@/lib/running/derive";

export type RunPrAchieved = {
  distanceLabel: string;
  durationSeconds: number;
  distanceKm: number;
};

export type RunFormResult =
  | { status: "error"; message: string }
  | { status: "success"; pr?: RunPrAchieved }
  | null;

/** Every logged run is its own row — running twice in one day (e.g. an
 * easy run plus intervals) is normal training, same reasoning as
 * swim_times allowing multiple entries per day. */
export async function logRunAction(
  _prevState: RunFormResult,
  formData: FormData,
): Promise<RunFormResult> {
  const parsed = runSchema.safeParse({
    distanceKm: formData.get("distanceKm"),
    hours: formData.get("hours"),
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

  const durationSeconds =
    parsed.data.hours * 3600 + parsed.data.minutes * 60 + parsed.data.seconds;
  const sessionDate = new Date().toISOString().slice(0, 10);

  // --- Work out whether this is a new PR from the history as it stood
  // BEFORE this save, so a run can only ever PR against what actually
  // came before it. Only matters if the run lands within tolerance of a
  // standard distance — there's no "PR" for an arbitrary distance. ---
  const distance = matchStandardDistance(parsed.data.distanceKm);
  let prRow: { distance_value: string; distance_km: number; duration_seconds: number } | null =
    null;
  let prAchieved: RunPrAchieved | null = null;
  if (distance) {
    const priorRuns = await getRuns(user.id);
    const priorBestPace = runsForDistance(priorRuns, distance).reduce(
      (best, r) => Math.min(best, pace(r)),
      Infinity,
    );
    const newPace = durationSeconds / parsed.data.distanceKm;
    if (newPace < priorBestPace) {
      prRow = {
        distance_value: distance.value,
        distance_km: parsed.data.distanceKm,
        duration_seconds: durationSeconds,
      };
      prAchieved = {
        distanceLabel: distance.label,
        durationSeconds,
        distanceKm: parsed.data.distanceKm,
      };
    }
  }

  const { error } = await supabase.from("runs").insert({
    user_id: user.id,
    distance_km: parsed.data.distanceKm,
    duration_seconds: durationSeconds,
    session_date: sessionDate,
  });
  if (error) return { status: "error", message: error.message };

  // Best-effort: the run itself already saved above, so a hiccup
  // recording a PR shouldn't turn a real, successful save into an error.
  if (prRow) {
    await supabase.from("running_prs").insert({ ...prRow, user_id: user.id, session_date: sessionDate });
  }

  revalidatePath("/dashboard/running");
  revalidatePath("/dashboard");
  if (prRow) revalidatePath("/dashboard/achievements");

  return { status: "success", ...(prAchieved && { pr: prAchieved }) };
}

/**
 * Deletes exactly one run: the single most recent one, and only if
 * `runId` still matches it — never an older entry, even if the id
 * passed in is stale (e.g. a second tab logged a newer run after this
 * page loaded). This is deliberately the only delete capability
 * exposed for running: a narrow, safe "undo my last entry" rather than
 * a general history editor, so a logging mistake (wrong distance,
 * minutes/seconds mixed up) can be fixed without ever touching
 * Supabase directly.
 */
export async function deleteLastRunAction(runId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: last } = await supabase
    .from("runs")
    .select("id")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last || last.id !== runId) return;

  const { data: deleted } = await supabase
    .from("runs")
    .delete()
    .eq("id", runId)
    .eq("user_id", user.id)
    .select("distance_km, duration_seconds, session_date")
    .maybeSingle();

  // The deleted run may have been recorded as a PR — a mistaken entry
  // (e.g. minutes/seconds mixed up) can easily look like an implausible
  // "record". Clean up the matching PR row too, so undoing the run
  // doesn't leave a bogus achievement behind. Best-effort: the run
  // itself is already gone either way.
  if (deleted) {
    await supabase
      .from("running_prs")
      .delete()
      .eq("user_id", user.id)
      .eq("session_date", deleted.session_date)
      .eq("distance_km", deleted.distance_km)
      .eq("duration_seconds", deleted.duration_seconds);
  }

  revalidatePath("/dashboard/running");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/achievements");
}
