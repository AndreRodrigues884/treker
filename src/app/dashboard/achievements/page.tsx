import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import {
  getAllExercises,
  getAllExerciseSets,
  getExercisePrs,
  getVolumeMilestones,
} from "@/lib/gym/queries";
import { totalVolumeEver } from "@/lib/gym/derive";
import { VOLUME_MILESTONES_KG } from "@/lib/constants/gym";
import { TRAINING_GOALS } from "@/lib/constants/onboarding";
import { formatDate } from "@/lib/chart-utils";
import { SectionSpinner } from "@/components/ui/section-spinner";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const goalLabel = profile?.goals.length
    ? TRAINING_GOALS.find((g) => g.value === profile.goals[0])?.label ?? null
    : null;

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

      <Suspense fallback={<SectionSpinner label="Loading your volume…" className="h-32" />}>
        <VolumeMilestonesSection userId={user.id} />
      </Suspense>

      <Suspense fallback={<SectionSpinner label="Loading your PRs…" />}>
        <PrHistorySection userId={user.id} />
      </Suspense>
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
  const [prs, exercises] = await Promise.all([
    getExercisePrs(userId),
    getAllExercises(userId),
  ]);
  const nameById = new Map(exercises.map((e) => [e.id, e.name]));

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Personal Records</h2>
        <p className="text-xs text-zinc-500">Every 1RM best, the moment it happened</p>
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
