"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/onboarding";

export type OnboardingResult = { status: "error"; message: string } | null;

export async function saveOnboardingAction(
  _prevState: OnboardingResult,
  formData: FormData,
): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse({
    modalities: formData.getAll("modalities"),
    goals: formData.getAll("goals"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    modalities: parsed.data.modalities,
    goals: parsed.data.goals,
    onboarding_completed: true,
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  // Without this, the sidebar (built once per layout render) could keep
  // showing the old sport list until a manual refresh — the redirect
  // below changes the URL, but doesn't by itself force the dashboard
  // layout's cached data to refetch.
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
