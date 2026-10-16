import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getAllExercises, getAllExerciseSets, getDeloadAcknowledgements } from "@/lib/gym/queries";
import {
  averageSessionsPerWeek,
  bestOneRepMaxPerExercise,
  deloadExercises,
  oneRepMaxHistory,
  sessionsPerWeekHistory,
  totalStrength,
  totalStrengthHistory,
  workoutsPerMuscleGroup,
} from "@/lib/gym/derive";
import { getRuns } from "@/lib/running/queries";
import { runsThisWeek, totalDistanceThisWeek, weeklyDistanceHistory } from "@/lib/running/derive";
import { getSwimTimes } from "@/lib/swimming/queries";
import { swimEventsWithData, swimTimeHistory } from "@/lib/swimming/derive";
import { SWIM_STROKES } from "@/lib/constants/swimming";
import type { Modality } from "@/lib/constants/onboarding";
import { MuscleGroupVolumeChart } from "@/components/gym/muscle-group-volume-chart";
import { ProgressChart } from "@/components/gym/progress-chart";
import { OneRepMaxCard } from "@/components/statistics/one-rep-max-card";
import { WeeklySessionsChart } from "@/components/statistics/weekly-sessions-chart";
import { SwimTimesCard } from "@/components/statistics/swim-times-card";
import { DeloadCard } from "@/components/statistics/deload-card";
import { StatisticsFilter, type StatSection } from "@/components/statistics/statistics-filter";
import { SectionSpinner } from "@/components/ui/section-spinner";

const VIOLET = "#a78bfa";
const EMERALD = "#34d399";
const ALL_MODALITIES: Modality[] = ["gym", "swimming", "running"];

export default async function StatisticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const availableModalities = ALL_MODALITIES.filter((m) =>
    profile?.modalities.includes(m),
  );
  if (availableModalities.length === 0) redirect("/dashboard");

  // Every card below reads from its modality's own two cache()-deduped
  // queries, so splitting them into independent Suspense boundaries
  // doesn't cost extra round trips — it just lets the title above render
  // immediately instead of the whole route blocking on one big
  // Promise.all before any HTML is sent. All sections render up front
  // regardless of the filter — StatisticsFilter just shows/hides them
  // client-side, so switching modalities is instant.
  const sections: StatSection[] = [];

  if (availableModalities.includes("gym")) {
    sections.push(
      {
        modality: "gym",
        content: (
          <Suspense fallback={<SectionSpinner label="Total Strength…" />}>
            <TotalStrengthSection userId={user.id} />
          </Suspense>
        ),
      },
      {
        modality: "gym",
        content: (
          <Suspense fallback={<SectionSpinner label="Estimated 1RM…" />}>
            <OneRepMaxSection userId={user.id} />
          </Suspense>
        ),
      },
      {
        modality: "gym",
        content: (
          <Suspense fallback={<SectionSpinner label="Deload analysis…" />}>
            <DeloadSection userId={user.id} />
          </Suspense>
        ),
      },
      {
        modality: "gym",
        content: (
          <Suspense fallback={<SectionSpinner label="Volume per muscle group…" />}>
            <VolumeSection userId={user.id} />
          </Suspense>
        ),
      },
      {
        modality: "gym",
        content: (
          <Suspense fallback={<SectionSpinner label="Sessions per week…" />}>
            <SessionsPerWeekSection userId={user.id} />
          </Suspense>
        ),
      },
    );
  }

  if (availableModalities.includes("running")) {
    sections.push({
      modality: "running",
      content: (
        <Suspense fallback={<SectionSpinner label="Weekly mileage…" />}>
          <WeeklyMileageSection userId={user.id} />
        </Suspense>
      ),
    });
  }

  if (availableModalities.includes("swimming")) {
    sections.push({
      modality: "swimming",
      content: (
        <Suspense fallback={<SectionSpinner label="Swim times…" />}>
          <SwimTimesSection userId={user.id} />
        </Suspense>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-zinc-400">Your numbers, across every sport you track.</p>
      </div>

      <StatisticsFilter availableModalities={availableModalities} sections={sections} />
    </div>
  );
}

async function TotalStrengthSection({ userId }: { userId: string }) {
  const [exercises, sets, profile] = await Promise.all([
    getAllExercises(userId),
    getAllExerciseSets(userId),
    getProfile(userId),
  ]);
  const bodyweightKg = profile?.bodyweight_kg ?? null;

  const oneRepMaxes = bestOneRepMaxPerExercise(exercises, sets, bodyweightKg);
  const strength = totalStrength(oneRepMaxes);
  const strengthHistory = totalStrengthHistory(exercises, sets, bodyweightKg);
  const strengthGain =
    strengthHistory.length > 1 ? strength - strengthHistory[0].value : 0;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-100">Total Strength</h2>
          <p className="text-xs text-zinc-500">
            Sum of accumulated 1RM · every exercise
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-violet-400">
            {formatKg(strength)}
          </p>
          {strengthGain > 0 && (
            <p className="text-xs font-medium text-emerald-400">
              +{formatKg(strengthGain)} gained
            </p>
          )}
        </div>
      </div>
      {strengthHistory.length < 2 ? (
        <EmptyNote>Log at least two sessions to see your progress.</EmptyNote>
      ) : (
        <ProgressChart points={strengthHistory} unit="kg" color={VIOLET} />
      )}
    </div>
  );
}

async function OneRepMaxSection({ userId }: { userId: string }) {
  const [exercises, sets, profile] = await Promise.all([
    getAllExercises(userId),
    getAllExerciseSets(userId),
    getProfile(userId),
  ]);
  const bodyweightKg = profile?.bodyweight_kg ?? null;

  const oneRepMaxes = bestOneRepMaxPerExercise(exercises, sets, bodyweightKg);
  const track1rmById = new Map(exercises.map((e) => [e.id, e.track_1rm]));
  const addsBodyweightById = new Map(exercises.map((e) => [e.id, e.adds_bodyweight]));
  const oneRepMaxExercises = oneRepMaxes
    .filter((e) => track1rmById.get(e.exerciseId) !== false)
    .map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      history: oneRepMaxHistory(
        sets.filter((s) => s.exercise_id === e.exerciseId),
        addsBodyweightById.get(e.exerciseId) ? bodyweightKg : null,
      ),
    }));

  return <OneRepMaxCard exercises={oneRepMaxExercises} />;
}

async function DeloadSection({ userId }: { userId: string }) {
  const [exercises, sets, acknowledgements] = await Promise.all([
    getAllExercises(userId),
    getAllExerciseSets(userId),
    getDeloadAcknowledgements(userId),
  ]);
  const plateaued = deloadExercises(exercises, sets, acknowledgements, 3);

  return (
    <StatCard title="Deload Analysis" subtitle="Exercises plateaued for 3+ sessions">
      <DeloadCard exercises={plateaued} />
    </StatCard>
  );
}

async function VolumeSection({ userId }: { userId: string }) {
  const [exercises, sets] = await Promise.all([
    getAllExercises(userId),
    getAllExerciseSets(userId),
  ]);
  const volumeByGroup = workoutsPerMuscleGroup(exercises, sets, 8);

  return (
    <StatCard
      title="Volume per Muscle Group"
      subtitle="Workouts logged per muscle group · last 8 weeks"
    >
      <MuscleGroupVolumeChart data={volumeByGroup} />
    </StatCard>
  );
}

async function SessionsPerWeekSection({ userId }: { userId: string }) {
  const [exercises, sets] = await Promise.all([
    getAllExercises(userId),
    getAllExerciseSets(userId),
  ]);
  const avgSessionsPerWeek = averageSessionsPerWeek(sets, exercises);
  const weeklyHistory = sessionsPerWeekHistory(sets, exercises, 5);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-100">Sessions per Week</h2>
          <p className="text-xs text-zinc-500">Week starts Monday</p>
        </div>
        <p className="text-sm text-zinc-400">
          Average:{" "}
          <span className="text-base font-bold text-cyan-300">
            {avgSessionsPerWeek.toFixed(1)}
          </span>{" "}
          sessions/wk
        </p>
      </div>
      <WeeklySessionsChart data={weeklyHistory} />
    </div>
  );
}

async function WeeklyMileageSection({ userId }: { userId: string }) {
  const runs = await getRuns(userId);
  const weekly = weeklyDistanceHistory(runs, 5);
  const thisWeekRuns = runsThisWeek(runs);
  const thisWeekKm = totalDistanceThisWeek(runs);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-100">Weekly Mileage</h2>
          <p className="text-xs text-zinc-500">Week starts Monday</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-emerald-400">{thisWeekKm.toFixed(1)}km</p>
          <p className="text-xs text-zinc-500">
            {thisWeekRuns} {thisWeekRuns === 1 ? "run" : "runs"} this week
          </p>
        </div>
      </div>
      <ProgressChart
        points={weekly.map((w) => ({ date: w.weekStart, value: w.distanceKm }))}
        unit="km"
        color={EMERALD}
      />
    </div>
  );
}

async function SwimTimesSection({ userId }: { userId: string }) {
  const times = await getSwimTimes(userId);
  const strokeOrder = SWIM_STROKES.map((s) => s.value);
  const events = swimEventsWithData(times)
    .sort((a, b) => {
      const strokeDiff = strokeOrder.indexOf(a.stroke) - strokeOrder.indexOf(b.stroke);
      return strokeDiff !== 0 ? strokeDiff : a.distanceM - b.distanceM;
    })
    .map((event) => {
      const strokeEntry = SWIM_STROKES.find((s) => s.value === event.stroke);
      return {
        eventKey: `${event.stroke}:${event.distanceM}`,
        eventLabel: `${event.distanceM}m ${strokeEntry?.label ?? event.stroke}`,
        history: swimTimeHistory(times, event),
      };
    });

  return <SwimTimesCard events={events} />;
}

function formatKg(value: number) {
  return `${value.toFixed(1)}kg`;
}

function StatCard({
  title,
  subtitle,
  note,
  children,
}: {
  title: string;
  subtitle: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
        {note && <p className="text-xs text-zinc-500">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}
