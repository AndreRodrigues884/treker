"use server";

import { redirect } from "next/navigation";
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

  redirect("/dashboard");
}
