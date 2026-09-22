import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** One row per day the user has logged their weight — small enough to
 * fetch in full and derive everything (latest, change, chart) client
 * side, same reasoning as the other modalities' logs. */
export const getBodyweightLogs = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bodyweight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: true });
  return data ?? [];
});
