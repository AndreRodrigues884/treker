import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";

/** Every run the user has ever logged — small enough (one row per run)
 * to fetch in full and derive everything (weekly mileage, pace trend,
 * personal bests) client side, same reasoning as Swimming's queries. */
export const getRuns = cache(async (userId: string) => {
  const supabase = await createClient();
  return fetchAllRows((from, to) =>
    supabase
      .from("runs")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );
});

/** One row per standard distance the user has set a goal for — small
 * and cheap enough to fetch in full, same reasoning as getRuns. */
export const getRunningGoals = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("running_goals")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
});

/** Every running PR the user has ever hit, most recent first — same
 * append-only convention as Gym's getExercisePrs. */
export const getRunningPrs = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("running_prs")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
});
