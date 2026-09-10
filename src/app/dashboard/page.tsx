import { Suspense } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getProfile, getDisplayName } from "@/lib/supabase/queries";
import { getAllExerciseSets } from "@/lib/gym/queries";
import { lastSessionDate, sessionsThisWeek, setsThisWeek } from "@/lib/gym/derive";
import { MODALITIES } from "@/lib/constants/onboarding";
import { Greeting } from "@/components/dashboard/greeting";
import { ModalityCard } from "@/components/dashboard/modality-card";
import { SectionSpinner } from "@/components/ui/section-spinner";

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

  return (
    <div className="space-y-6">
      {/* Greeting and the week total now live in one card, so both wait
       * on the same (cheap, cached) profile/sets query and stream in
       * together — showing half the card instantly and the other half a
       * beat later would look broken inside a single visual unit. */}
      <Suspense fallback={<SectionSpinner label="Loading your week…" className="h-28" />}>
        <OverviewHero user={user} />
      </Suspense>

      <Suspense fallback={<SectionSpinner label="Loading your modalities…" />}>
        <ModalityGrid userId={user?.id} />
      </Suspense>
    </div>
  );
}

async function OverviewHero({ user }: { user: User | null }) {
  const profile = user ? await getProfile(user.id) : null;
  const tracksGym = profile?.modalities.includes("gym") ?? false;
  const gymSets = user && tracksGym ? await getAllExerciseSets(user.id) : [];
  const workouts = sessionsThisWeek(gymSets);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-br from-slate-900 via-indigo-950/50 to-slate-900 p-6">
      <div className="pointer-events-none absolute -top-16 -left-12 h-56 w-56 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          {user?.email && (
            <Greeting name={getDisplayName(user)} email={user.email} />
          )}
        </div>

        {tracksGym && (
          <div className="text-left sm:text-right">
            <p className="bg-linear-to-r from-amber-300 via-orange-400 to-pink-500 bg-clip-text text-4xl font-bold text-transparent">
              {workouts}
            </p>
            <p className="text-sm text-zinc-400">
              {workouts === 1 ? "workout" : "workouts"} this week
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

async function ModalityGrid({ userId }: { userId: string | undefined }) {
  const profile = userId ? await getProfile(userId) : null;
  const tabs = MODALITIES.filter((m) => profile?.modalities.includes(m.value));
  const tracksGym = tabs.some((t) => t.value === "gym");

  const gymSets = userId && tracksGym ? await getAllExerciseSets(userId) : [];

  return (
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
  );
}
