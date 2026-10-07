import { Suspense } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getProfile, getDisplayName } from "@/lib/supabase/queries";
import { getAllExercises, getAllExerciseSets } from "@/lib/gym/queries";
import { lastSessionDate, sessionsThisWeek, setsThisWeek } from "@/lib/gym/derive";
import { getSwimTimes } from "@/lib/swimming/queries";
import { swimTimesThisWeek } from "@/lib/swimming/derive";
import { getRuns } from "@/lib/running/queries";
import { runsThisWeek } from "@/lib/running/derive";
import { getBodyweightLogs } from "@/lib/bodyweight/queries";
import { MODALITIES } from "@/lib/constants/onboarding";
import { Greeting } from "@/components/dashboard/greeting";
import { ModalityCard } from "@/components/dashboard/modality-card";
import { BodyweightCard } from "@/components/dashboard/bodyweight-card";
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

      {/* Not tied to any one modality — shown regardless of which
       * sports the user tracks, so it gets its own Suspense boundary
       * rather than living inside ModalityGrid. */}
      <Suspense fallback={<SectionSpinner label="Loading your bodyweight…" className="h-40" />}>
        <BodyweightSection userId={user?.id} />
      </Suspense>
    </div>
  );
}

async function BodyweightSection({ userId }: { userId: string | undefined }) {
  const logs = userId ? await getBodyweightLogs(userId) : [];
  return <BodyweightCard logs={logs} />;
}

async function OverviewHero({ user }: { user: User | null }) {
  const profile = user ? await getProfile(user.id) : null;
  const tracksGym = profile?.modalities.includes("gym") ?? false;
  const tracksSwimming = profile?.modalities.includes("swimming") ?? false;
  const tracksRunning = profile?.modalities.includes("running") ?? false;

  const [gymExercises, gymSets, swimTimes, runs] = await Promise.all([
    user && tracksGym ? getAllExercises(user.id) : Promise.resolve([]),
    user && tracksGym ? getAllExerciseSets(user.id) : Promise.resolve([]),
    user && tracksSwimming ? getSwimTimes(user.id) : Promise.resolve([]),
    user && tracksRunning ? getRuns(user.id) : Promise.resolve([]),
  ]);
  const workouts = sessionsThisWeek(gymSets, gymExercises);
  const swims = swimTimesThisWeek(swimTimes);
  const runsThisWk = runsThisWeek(runs);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-linear-to-br from-slate-800 via-indigo-900/50 to-slate-800 p-6">
      <div className="pointer-events-none absolute -top-16 -left-12 h-56 w-56 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          {user?.email && (
            <Greeting name={getDisplayName(user)} email={user.email} />
          )}
        </div>

        {(tracksGym || tracksSwimming || tracksRunning) && (
          <div className="flex flex-wrap gap-6">
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
            {tracksSwimming && (
              <div className="text-left sm:text-right">
                <p className="bg-linear-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-4xl font-bold text-transparent">
                  {swims}
                </p>
                <p className="text-sm text-zinc-400">
                  {swims === 1 ? "time" : "times"} logged this week
                </p>
              </div>
            )}
            {tracksRunning && (
              <div className="text-left sm:text-right">
                <p className="bg-linear-to-r from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-4xl font-bold text-transparent">
                  {runsThisWk}
                </p>
                <p className="text-sm text-zinc-400">
                  {runsThisWk === 1 ? "run" : "runs"} this week
                </p>
              </div>
            )}
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
  const tracksSwimming = tabs.some((t) => t.value === "swimming");
  const tracksRunning = tabs.some((t) => t.value === "running");

  const [gymSets, swimTimes, runs] = await Promise.all([
    userId && tracksGym ? getAllExerciseSets(userId) : Promise.resolve([]),
    userId && tracksSwimming ? getSwimTimes(userId) : Promise.resolve([]),
    userId && tracksRunning ? getRuns(userId) : Promise.resolve([]),
  ]);

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

        if (tab.value === "swimming") {
          const last = swimTimes.length
            ? swimTimes.reduce(
                (latest, t) => (t.session_date > latest ? t.session_date : latest),
                swimTimes[0].session_date,
              )
            : null;
          return (
            <ModalityCard
              key={tab.value}
              href="/dashboard/swimming"
              icon={tab.icon}
              tint={tab.tint}
              label={tab.label}
            >
              {last ? (
                <>
                  Last time logged: {formatFriendlyDate(last)}
                  <br />
                  {swimTimes.length} {swimTimes.length === 1 ? "time" : "times"} total
                </>
              ) : (
                "No times logged yet"
              )}
            </ModalityCard>
          );
        }

        if (tab.value === "running") {
          const last = runs.length
            ? runs.reduce(
                (latest, r) => (r.session_date > latest ? r.session_date : latest),
                runs[0].session_date,
              )
            : null;
          return (
            <ModalityCard
              key={tab.value}
              href="/dashboard/running"
              icon={tab.icon}
              tint={tab.tint}
              label={tab.label}
            >
              {last ? (
                <>
                  Last run: {formatFriendlyDate(last)}
                  <br />
                  {runs.length} {runs.length === 1 ? "run" : "runs"} total
                </>
              ) : (
                "No runs logged yet"
              )}
            </ModalityCard>
          );
        }
      })}
    </div>
  );
}
