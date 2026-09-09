import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getAllExerciseSets } from "@/lib/gym/queries";
import { lastSessionDate, sessionsThisWeek, setsThisWeek } from "@/lib/gym/derive";
import { MODALITIES } from "@/lib/constants/onboarding";
import { Greeting } from "@/components/dashboard/greeting";
import { ModalityCard } from "@/components/dashboard/modality-card";

function formatFriendlyDate(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const tabs = MODALITIES.filter((m) => profile?.modalities.includes(m.value));
  const tracksGym = tabs.some((t) => t.value === "gym");

  const gymSets = user && tracksGym ? await getAllExerciseSets(user.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        {user?.email && <Greeting email={user.email} />}
      </div>

      {tracksGym && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-sm text-zinc-500">This week</p>
          <p className="text-2xl font-bold text-zinc-100">
            {sessionsThisWeek(gymSets)}{" "}
            <span className="text-base font-normal text-zinc-400">
              {sessionsThisWeek(gymSets) === 1 ? "workout" : "workouts"}
            </span>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {tabs.map((tab) => {
          if (tab.value === "gym") {
            const last = lastSessionDate(gymSets);
            return (
              <ModalityCard
                key={tab.value}
                href="/dashboard/gym"
                icon={tab.icon}
                tint={tab.tint}
                label={tab.label}
              >
                {last ? (
                  <>
                    Last session: {formatFriendlyDate(last)}
                    <br />
                    {setsThisWeek(gymSets)} sets this week
                  </>
                ) : (
                  "No sessions logged yet"
                )}
              </ModalityCard>
            );
          }

          return (
            <ModalityCard
              key={tab.value}
              href={`/dashboard/${tab.value}`}
              icon={tab.icon}
              tint={tab.tint}
              label={tab.label}
            >
              Coming soon
            </ModalityCard>
          );
        })}
      </div>
    </div>
  );
}
