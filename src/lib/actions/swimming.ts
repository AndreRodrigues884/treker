"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { swimTimeSchema } from "@/lib/validation/swimming";

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
