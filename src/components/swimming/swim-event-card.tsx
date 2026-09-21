"use client";

import { SWIM_STROKES } from "@/lib/constants/swimming";
import {
  formatSwimTime,
  swimTimeHistory,
  type SwimEvent,
} from "@/lib/swimming/derive";
import type { SwimGoal, SwimTime } from "@/types/swimming";
import { ProgressChart } from "@/components/gym/progress-chart";
import { SwimGoalCard } from "@/components/swimming/swim-goal-card";

const CYAN = "#22d3ee";

export function SwimEventCard({
  event,
  times,
  goal,
}: {
  event: SwimEvent;
  times: SwimTime[];
  goal: SwimGoal | null;
}) {
  const strokeEntry = SWIM_STROKES.find((s) => s.value === event.stroke);
  const history = swimTimeHistory(times, event);
  const latest = history.at(-1)?.value;
  const best = history.length ? Math.min(...history.map((p) => p.value)) : undefined;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-100">
            <span aria-hidden>{strokeEntry?.icon}</span> {event.distanceM}m{" "}
            {strokeEntry?.label ?? event.stroke}
          </h3>
          <p className="text-xs text-zinc-500">
            {history.length} {history.length === 1 ? "time" : "times"} logged
          </p>
        </div>
        {latest != null && (
          <div className="text-right">
            <p className="text-xl font-bold text-cyan-300">
              {formatSwimTime(latest)}
            </p>
            {best != null && best < latest && (
              <p className="text-xs text-zinc-500">Best: {formatSwimTime(best)}</p>
            )}
          </div>
        )}
      </div>

      <ProgressChart
        points={history}
        color={CYAN}
        formatValue={formatSwimTime}
      />

      <SwimGoalCard event={event} history={history} goal={goal} />
    </div>
  );
}
