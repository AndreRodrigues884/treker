import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { OnboardingForm } from "@/components/forms/onboarding-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-400">
          Change which sports you track and your goals.
        </p>
      </div>
      <OnboardingForm
        defaultModalities={profile?.modalities ?? []}
        defaultGoals={profile?.goals ?? []}
        submitLabel="Save changes"
      />
    </div>
  );
}
