"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runSchema } from "@/lib/validation/running";

export type RunFormResult =
  | { status: "error"; message: string }
  | { status: "success" }
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

  const { error } = await supabase.from("runs").insert({
    user_id: user.id,
    distance_km: parsed.data.distanceKm,
    duration_seconds: durationSeconds,
    session_date: new Date().toISOString().slice(0, 10),
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/dashboard/running");
  revalidatePath("/dashboard");
  return { status: "success" };
}
