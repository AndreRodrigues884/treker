import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";

/** Every time the user has ever logged, across every stroke/distance —
 * small enough (one row per session) that fetching it all at once and
 * grouping client-side, same as Gym's cross-cutting queries, is simpler
 * than a query per event. */
export const getSwimTimes = cache(async (userId: string) => {
  const supabase = await createClient();
  return fetchAllRows((from, to) =>
    supabase
      .from("swim_times")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );
});

/** Every swim PR the user has ever hit, most recent first — same
 * append-only convention as Gym's getExercisePrs. */
export const getSwimPrs = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("swim_prs")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
});

/** One row per (stroke, distance) the user has set a goal for — small
 * and cheap enough to fetch in full, same reasoning as getSwimTimes. */
export const getSwimGoals = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("swim_goals")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
});
