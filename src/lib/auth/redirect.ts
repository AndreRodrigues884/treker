import { getProfile } from "@/lib/supabase/queries";

/** Where a logged-in user should land: finish onboarding, or the dashboard. */
export async function getPostAuthPath(userId: string) {
  const profile = await getProfile(userId);
  return profile?.onboarding_completed ? "/dashboard" : "/onboarding";
}
