import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getRuns } from "@/lib/running/queries";
import { formatDuration, formatPace, pace, runsForDistance } from "@/lib/running/derive";
import { STANDARD_DISTANCES } from "@/lib/constants/running";
import { LogRunForm } from "@/components/running/log-run-form";
import { DistanceProgressCard } from "@/components/running/distance-progress-card";
import { SectionSpinner } from "@/components/ui/section-spinner";

export default async function RunningPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.modalities.includes("running")) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Running</h1>
        <p className="text-zinc-400">
          Log a run and watch your pace per distance over time. Weekly mileage lives on{" "}
          <Link href="/dashboard/statistics" className="text-emerald-400 hover:underline">
            Statistics
          </Link>
          .
        </p>
      </div>

      {/* Distance/duration are free-form, no data needed, so the log
       * form renders instantly. Everything below needs every logged
       * run, deferred into its own Suspense. */}
      <LogRunForm />

      <Suspense fallback={<SectionSpinner label="Loading your runs…" className="h-40" />}>
        <RunningStats userId={user.id} />
      </Suspense>
    </div>
  );
}

async function RunningStats({ userId }: { userId: string }) {
  const runs = await getRuns(userId);

  if (runs.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-zinc-500">
        No runs logged yet. Log your first one above to start tracking.
      </p>
    );
  }

  const distances = STANDARD_DISTANCES.map((d) => ({
    distance: d,
    runs: runsForDistance(runs, d),
  })).filter((d) => d.runs.length > 0);

  const recent = [...runs].reverse().slice(0, 10);

  return (
    <div className="space-y-3">
      {distances.map(({ distance, runs: distanceRuns }) => (
        <DistanceProgressCard key={distance.value} distance={distance} runs={distanceRuns} />
      ))}

      <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
        <h2 className="font-semibold text-zinc-100">Recent Runs</h2>
        <ul className="space-y-2">
          {recent.map((run) => (
            <li
              key={run.id}
              className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-zinc-100">{Number(run.distance_km)}km</p>
                <p className="text-xs text-zinc-500">{run.session_date}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-300">{formatDuration(run.duration_seconds)}</p>
                <p className="text-xs text-zinc-500">{formatPace(pace(run))}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
