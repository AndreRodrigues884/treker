import { Suspense } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getProfile, getDisplayName } from "@/lib/supabase/queries";
import { getAllExercises, getAllExerciseSets } from "@/lib/gym/queries";
import { lastSessionDate, sessionsThisWeek, setsThisWeek } from "@/lib/gym/derive";
import { getSwimTimes } from "@/lib/swimming/queries";
import { swimTimesThisWeek } from "@/lib/swimming/derive";
import { getRuns } from "@/lib/running/queries";
import { runsThisWeek } from "@/lib/running/derive";
import { activeDaysRecently, trainingTitle, type TrainingTier } from "@/lib/dashboard/derive";
import { MODALITIES } from "@/lib/constants/onboarding";
import { Greeting } from "@/components/dashboard/greeting";
import { ModalityCard } from "@/components/dashboard/modality-card";
import { WeeklyRing, type WeeklyRingSegment } from "@/components/dashboard/weekly-ring";
import { SectionSpinner } from "@/components/ui/section-spinner";

// One visual theme per training tier — the "gamified" part of the
// title feature: the hero card's gradient/glow and the title badge
// shift with it, so a more active stretch doesn't just read
// differently, it *looks* different. "starting" deliberately matches
// the card's original indigo/fuchsia look, so a brand-new or quiet
// account isn't visually flagged as different, just invited back in.
const TIER_THEME: Record<
  TrainingTier,
  { gradient: string; blob1: string; blob2: string; badge: string }
> = {
  intense: {
    gradient: "from-slate-800 via-orange-900/50 to-slate-800",
    blob1: "bg-orange-600/30",
    blob2: "bg-red-600/20",
    badge: "border-orange-400/40 bg-orange-500/10 text-orange-300",
  },
  regular: {
    gradient: "from-slate-800 via-emerald-900/50 to-slate-800",
    blob1: "bg-emerald-600/30",
    blob2: "bg-teal-600/20",
    badge: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  },
  building: {
    gradient: "from-slate-800 via-cyan-900/50 to-slate-800",
    blob1: "bg-cyan-600/30",
    blob2: "bg-blue-600/20",
    badge: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
  },
  starting: {
    gradient: "from-slate-800 via-indigo-900/50 to-slate-800",
    blob1: "bg-indigo-600/30",
    blob2: "bg-fuchsia-600/20",
    badge: "border-indigo-400/40 bg-indigo-500/10 text-indigo-300",
  },
};

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

  // Cross-modality, recent-window signal (see lib/dashboard/derive.ts)
  // rather than all-time history, so the title reflects how training
  // has actually been going lately, not a burst of activity months ago.
  const activeDays = activeDaysRecently(gymSets, runs, swimTimes);
  const { title, subtitle, tier } = trainingTitle(activeDays);
  const theme = TIER_THEME[tier];

  const segments: WeeklyRingSegment[] = [
    tracksGym && { modality: "gym" as const, count: workouts },
    tracksRunning && { modality: "running" as const, count: runsThisWk },
    tracksSwimming && { modality: "swimming" as const, count: swims },
  ].filter((s): s is WeeklyRingSegment => s !== false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-700 bg-linear-to-br p-6 transition-colors duration-700 ${theme.gradient}`}
    >
      <div
        className={`pointer-events-none absolute -top-16 -left-12 h-56 w-56 rounded-full blur-3xl transition-colors duration-700 ${theme.blob1}`}
      />
      <div
        className={`pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full blur-3xl transition-colors duration-700 ${theme.blob2}`}
      />

      {/* Always a row, even on a phone — the ring shrinks through its
       * own responsive size classes instead of ever dropping below the
       * text, so it's always visible beside the greeting. */}
      <div className="relative flex flex-row items-center justify-between gap-3 sm:gap-6">
        <div className="min-w-0 flex-1">
          <p
            className={`mb-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
          >
            {title}
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">Welcome back</h1>
          {user?.email && (
            <Greeting name={getDisplayName(user)} email={user.email} />
          )}
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>

        {segments.length > 0 && <WeeklyRing segments={segments} />}
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
