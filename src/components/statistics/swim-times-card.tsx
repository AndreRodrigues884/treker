"use client";

import { useState } from "react";
import { ProgressChart } from "@/components/gym/progress-chart";
import { formatSwimTime } from "@/lib/swimming/derive";
import type { ProgressPoint } from "@/lib/gym/derive";

const CYAN = "#22d3ee";

export type SwimEventHistory = {
  eventKey: string;
  eventLabel: string;
  history: ProgressPoint[];
};

/** Time progression per swim event (stroke + distance) — the Statistics
 * equivalent of the per-event chart already on the Swimming page itself,
 * just picker-driven instead of one card per event, matching how Gym's
 * 1RM/Endurance cards work. Lower is faster. */
export function SwimTimesCard({ events }: { events: SwimEventHistory[] }) {
  const [selectedKey, setSelectedKey] = useState(events[0]?.eventKey);
  const selected = events.find((e) => e.eventKey === selectedKey);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Swim Times</h2>
        <p className="text-xs text-zinc-500">Time progression per event · lower is faster</p>
      </div>

      {!selected ? (
        <p className="text-sm text-zinc-500">Log a swim time to see this.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {events.map((e) => (
              <button
                key={e.eventKey}
                type="button"
                onClick={() => setSelectedKey(e.eventKey)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  e.eventKey === selected.eventKey
                    ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                    : "border-slate-700 text-zinc-400 hover:border-slate-500"
                }`}
              >
                {e.eventLabel}
              </button>
            ))}
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-xs text-zinc-500">Current</p>
              <p className="text-xl font-bold text-cyan-300">
                {formatSwimTime(selected.history.at(-1)?.value ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Best</p>
              <p className="text-xl font-bold text-zinc-100">
                {formatSwimTime(Math.min(...selected.history.map((p) => p.value)))}
              </p>
            </div>
          </div>

          <ProgressChart points={selected.history} color={CYAN} formatValue={formatSwimTime} />
        </>
      )}
    </div>
  );
}
