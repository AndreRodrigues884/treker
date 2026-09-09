import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { OnboardingForm } from "@/components/forms/onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile?.onboarding_completed) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-2xl space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Set up your training</h1>
          <p className="text-zinc-400">
            Pick what you&apos;re training for and which sports you want to
            track. You can change this anytime in Settings.
          </p>
        </div>
        <OnboardingForm
          defaultModalities={profile?.modalities ?? []}
          defaultGoals={profile?.goals ?? []}
        />
      </div>
    </main>
  );
}
