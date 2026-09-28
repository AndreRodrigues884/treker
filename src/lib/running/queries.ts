import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Every run the user has ever logged — small enough (one row per run)
 * to fetch in full and derive everything (weekly mileage, pace trend,
 * personal bests) client side, same reasoning as Swimming's queries. */
export const getRuns = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
});
