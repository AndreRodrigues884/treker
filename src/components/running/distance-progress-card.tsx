"use client";

import { formatPace } from "@/lib/running/derive";
import type { StandardDistance } from "@/lib/constants/running";
import { ProgressChart } from "@/components/gym/progress-chart";
import type { ProgressPoint } from "@/lib/gym/derive";

const EMERALD = "#34d399";

/** One card per standard distance — mirrors SwimEventCard's per-event
 * layout (header with latest/best, chart underneath) rather than a
 * picker across distances, so every distance you've actually run shows
 * its own trend at a glance. */
export function DistanceProgressCard({
  distance,
  history,
}: {
  distance: StandardDistance;
  history: ProgressPoint[];
}) {
  const latest = history.at(-1)?.value;
  const best = history.length ? Math.min(...history.map((p) => p.value)) : undefined;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-100">{distance.label}</h3>
          <p className="text-xs text-zinc-500">
            {history.length} {history.length === 1 ? "run" : "runs"} logged
          </p>
        </div>
        {latest != null && (
          <div className="text-right">
            <p className="text-xl font-bold text-emerald-300">{formatPace(latest)}</p>
            {best != null && best < latest && (
              <p className="text-xs text-zinc-500">Best: {formatPace(best)}</p>
            )}
          </div>
        )}
      </div>

      <ProgressChart points={history} color={EMERALD} formatValue={formatPace} />
    </div>
  );
}
