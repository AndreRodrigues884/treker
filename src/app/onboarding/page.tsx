import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { OnboardingWizard } from "@/components/forms/onboarding-wizard";
import { signOutAction } from "@/lib/auth/actions";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile?.onboarding_completed) redirect("/dashboard");

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-slate-950 px-6 py-6 text-zinc-100">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

      <form action={signOutAction} className="absolute right-4 top-4 z-10">
        <button
          type="submit"
          className="text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          Log out
        </button>
      </form>

      <div className="relative mx-auto flex h-full w-full max-w-md flex-1 flex-col">
        <OnboardingWizard
          defaultModalities={profile?.modalities ?? []}
          defaultGoals={profile?.goals ?? []}
        />
      </div>
    </main>
  );
}
