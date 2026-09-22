"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bodyweightLogSchema } from "@/lib/validation/bodyweight";

export type BodyweightFormResult =
  | { status: "error"; message: string }
  | { status: "success" }
  | null;

/** Today's weight is a single value, not a log of attempts — re-logging
 * today replaces it (upsert), same convention as swim_goals rather than
 * swim_times. */
export async function logBodyweightAction(
  _prevState: BodyweightFormResult,
  formData: FormData,
): Promise<BodyweightFormResult> {
  const parsed = bodyweightLogSchema.safeParse({
    weightKg: formData.get("weightKg"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const { error } = await supabase.from("bodyweight_logs").upsert(
    {
      user_id: user.id,
      weight_kg: parsed.data.weightKg,
      logged_at: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "user_id,logged_at" },
  );
  if (error) return { status: "error", message: error.message };

  revalidatePath("/dashboard");
  return { status: "success" };
}
