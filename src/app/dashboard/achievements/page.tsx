import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import {
  getAllExercises,
  getAllExerciseSets,
  getExercisePrs,
  getVolumeMilestones,
} from "@/lib/gym/queries";
import { latestPrPerExercise, totalVolumeEver } from "@/lib/gym/derive";
import { VOLUME_MILESTONES_KG } from "@/lib/constants/gym";
import { getRunningPrs } from "@/lib/running/queries";
import { formatDuration, latestPrPerDistance } from "@/lib/running/derive";
import { getSwimPrs } from "@/lib/swimming/queries";
import { formatSwimTime, latestPrPerEvent } from "@/lib/swimming/derive";
import { SWIM_STROKES } from "@/lib/constants/swimming";
import { TRAINING_GOALS } from "@/lib/constants/onboarding";
import type { Modality } from "@/lib/constants/onboarding";
import { formatDate } from "@/lib/chart-utils";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { StatisticsFilter, type StatSection } from "@/components/statistics/statistics-filter";

const ALL_MODALITIES: Modality[] = ["gym", "swimming", "running"];

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const goalLabel = profile?.goals.length
    ? TRAINING_GOALS.find((g) => g.value === profile.goals[0])?.label ?? null
    : null;
  const availableModalities = ALL_MODALITIES.filter((m) =>
    profile?.modalities.includes(m),
  );

  // Every section renders up front (each still streams in via its own
  // Suspense boundary) and StatisticsFilter just shows/hides them
  // client-side — same convention as the Statistics page's filter.
  const sections: StatSection[] = [];

  if (availableModalities.includes("gym")) {
    sections.push(
      {
        modality: "gym",
        content: (
          <Suspense fallback={<SectionSpinner label="Loading your volume…" className="h-32" />}>
            <VolumeMilestonesSection userId={user.id} />
          </Suspense>
        ),
      },
      {
        modality: "gym",
        content: (
          <Suspense fallback={<SectionSpinner label="Loading your PRs…" />}>
            <PrHistorySection userId={user.id} />
          </Suspense>
        ),
      },
    );
  }

  if (availableModalities.includes("running")) {
    sections.push({
      modality: "running",
      content: (
        <Suspense fallback={<SectionSpinner label="Loading your running PRs…" />}>
          <RunningPrsSection userId={user.id} />
        </Suspense>
      ),
    });
  }

  if (availableModalities.includes("swimming")) {
    sections.push({
      modality: "swimming",
      content: (
        <Suspense fallback={<SectionSpinner label="Loading your swim PRs…" />}>
          <SwimPrsSection userId={user.id} />
        </Suspense>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-zinc-400">
          Personal records and lifetime milestones — earned, not invented.
        </p>
      </div>

      {/* Moved here from the sidebar footer, which now just links to this
       * page instead of showing this inline. */}
      <div className="space-y-1 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
        {goalLabel && <p className="text-sm text-zinc-300">🎯 {goalLabel}</p>}
        <p className="text-sm text-zinc-500">{user.email}</p>
      </div>

      <StatisticsFilter availableModalities={availableModalities} sections={sections} />
    </div>
  );
}

async function VolumeMilestonesSection({ userId }: { userId: string }) {
  const [exercises, sets, achieved] = await Promise.all([
    getAllExercises(userId),
    getAllExerciseSets(userId),
    getVolumeMilestones(userId),
  ]);

  const totalVolume = totalVolumeEver(exercises, sets);
  const achievedThresholds = new Set(achieved.map((m) => m.threshold_kg));
  const nextThreshold = VOLUME_MILESTONES_KG.find((t) => !achievedThresholds.has(t));
  const progressPct = nextThreshold
    ? Math.min(100, (totalVolume / nextThreshold) * 100)
    : 100;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-100">Lifetime Volume</h2>
          <p className="text-xs text-zinc-500">Total kg lifted, every exercise, all time</p>
        </div>
        <p className="text-2xl font-bold text-amber-300">
          {Math.round(totalVolume).toLocaleString()}kg
        </p>
      </div>

      {nextThreshold && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-2 rounded-full bg-linear-to-r from-amber-400 to-orange-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {Math.round(totalVolume).toLocaleString()} / {nextThreshold.toLocaleString()}kg
            to next milestone
          </p>
        </div>
      )}

      {achieved.length > 0 && (
        <ul className="flex flex-wrap gap-2 pt-1">
          {achieved.map((m) => (
            <li
              key={m.id}
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
            >
              🏆 {m.threshold_kg.toLocaleString()}kg — {formatDate(m.achieved_at)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function PrHistorySection({ userId }: { userId: string }) {
  const [allPrs, exercises] = await Promise.all([
    getExercisePrs(userId),
    getAllExercises(userId),
  ]);
  // A current-bests board, not a growing timeline — exercise_prs itself
  // still keeps every PR ever hit, this just shows the latest (= best)
  // one per exercise.
  const prs = latestPrPerExercise(allPrs);
  const nameById = new Map(exercises.map((e) => [e.id, e.name]));

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Gym Personal Records</h2>
        <p className="text-xs text-zinc-500">Your current best on every exercise</p>
      </div>
      {prs.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No PRs yet — keep training and they&apos;ll show up here.
        </p>
      ) : (
        <ul className="space-y-2">
          {prs.map((pr) => (
            <li
              key={pr.id}
              className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-zinc-100">
                  {nameById.get(pr.exercise_id) ?? "Exercise"}
                </p>
                <p className="text-xs text-zinc-500">{formatDate(pr.session_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-300">
                  {pr.weight_kg}kg × {pr.reps}
                </p>
                <p className="text-xs text-zinc-500">
                  1RM est. {Number(pr.one_rep_max).toFixed(1)}kg
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function RunningPrsSection({ userId }: { userId: string }) {
  const allPrs = await getRunningPrs(userId);
  // Same "current bests board" convention as Gym's PrHistorySection —
  // running_prs keeps every PR ever hit, this just shows the latest
  // (= best) one per standard distance.
  const prs = latestPrPerDistance(allPrs);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Running Personal Records</h2>
        <p className="text-xs text-zinc-500">Your fastest time at each standard distance</p>
      </div>
      {prs.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No PRs yet — log a run at a standard distance (5K, 10K, half marathon…) to start
          earning them.
        </p>
      ) : (
        <ul className="space-y-2">
          {prs.map((pr) => (
            <li
              key={pr.id}
              className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-zinc-100">
                  {Number(pr.distance_km)}km ({pr.distance_value.replace("_", " ")})
                </p>
                <p className="text-xs text-zinc-500">{formatDate(pr.session_date)}</p>
              </div>
              <p className="text-emerald-300">{formatDuration(pr.duration_seconds)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function SwimPrsSection({ userId }: { userId: string }) {
  const allPrs = await getSwimPrs(userId);
  // Same "current bests board" convention as Gym's PrHistorySection —
  // swim_prs keeps every PR ever hit, this just shows the latest (=
  // best) one per (stroke, distance) event.
  const prs = latestPrPerEvent(allPrs);
  const strokeByValue = new Map(SWIM_STROKES.map((s) => [s.value, s]));

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Swimming Personal Records</h2>
        <p className="text-xs text-zinc-500">Your fastest time at each stroke and distance</p>
      </div>
      {prs.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No PRs yet — log a swim time to start earning them.
        </p>
      ) : (
        <ul className="space-y-2">
          {prs.map((pr) => {
            const strokeEntry = strokeByValue.get(pr.stroke);
            return (
              <li
                key={pr.id}
                className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-zinc-100">
                    <span aria-hidden>{strokeEntry?.icon}</span> {pr.distance_m}m{" "}
                    {strokeEntry?.label ?? pr.stroke}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(pr.session_date)}</p>
                </div>
                <p className="text-cyan-300">{formatSwimTime(Number(pr.time_seconds))}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
