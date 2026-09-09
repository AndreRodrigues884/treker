import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { MODALITIES } from "@/lib/constants/onboarding";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const tabs = MODALITIES.filter((m) =>
    profile?.modalities.includes(m.value),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-zinc-400">Here&apos;s what you&apos;re tracking.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <span
            key={tab.value}
            className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-300"
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${tab.tint}`}>
              {tab.icon}
            </span>
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
}
