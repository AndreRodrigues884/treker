import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { MODALITIES } from "@/lib/constants/onboarding";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const tabs = MODALITIES.filter((m) =>
    profile?.modalities.includes(m.value),
  );

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="text-zinc-400">
        Tracking: {tabs.map((t) => t.label).join(", ") || "no sports yet"}.
      </p>
    </div>
  );
}
