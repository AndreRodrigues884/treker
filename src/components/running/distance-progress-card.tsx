"use client";

import {
  formatDuration,
  formatPace,
  mostRecentRun,
  pace,
  paceHistory,
  runningTimeHistory,
} from "@/lib/running/derive";
import type { StandardDistance } from "@/lib/constants/running";
import { ProgressChart } from "@/components/gym/progress-chart";
import { RunningGoalCard } from "@/components/running/running-goal-card";
import type { Run, RunningGoal } from "@/types/running";

const EMERALD = "#34d399";

/** One card per standard distance — mirrors SwimEventCard's per-event
 * layout (header with the latest run's time + pace, chart underneath,
 * goal card at the bottom) rather than a picker across distances, so
 * every distance you've actually run shows its own trend at a glance.
 * The header reads from one real run (the most recent) — time first,
 * since that's the concrete thing you did, pace underneath as the
 * derived number. */
export function DistanceProgressCard({
  distance,
  runs,
  goal,
}: {
  distance: StandardDistance;
  runs: Run[];
  goal: RunningGoal | null;
}) {
  const history = paceHistory(runs);
  const latest = mostRecentRun(runs);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-100">{distance.label}</h3>
          <p className="text-xs text-zinc-500">
            {runs.length} {runs.length === 1 ? "run" : "runs"} logged
          </p>
        </div>
        {latest && (
          <div className="text-right">
            <p className="text-xl font-bold text-emerald-300">
              {formatDuration(latest.duration_seconds)}
            </p>
            <p className="text-xs text-zinc-500">{formatPace(pace(latest))}</p>
          </div>
        )}
      </div>

      <ProgressChart points={history} color={EMERALD} formatValue={formatPace} />

      <RunningGoalCard distance={distance} history={runningTimeHistory(runs, distance)} goal={goal} />
    </div>
  );
}
