"use client";

import { useActionState } from "react";
import { logBodyweightAction, type BodyweightFormResult } from "@/lib/actions/bodyweight";
import {
  bodyweightChangeSinceStart,
  bodyweightHistory,
  latestBodyweight,
  loggedToday,
} from "@/lib/bodyweight/derive";
import { todayISO } from "@/lib/gym/derive";
import type { BodyweightLog } from "@/types/bodyweight";
import { ProgressChart } from "@/components/gym/progress-chart";
import { SpinnerIcon } from "@/components/ui/icons";

const initialState: BodyweightFormResult = null;

export function BodyweightCard({ logs }: { logs: BodyweightLog[] }) {
  const [state, formAction, pending] = useActionState(logBodyweightAction, initialState);

  const history = bodyweightHistory(logs);
  const latest = latestBodyweight(logs);
  const change = bodyweightChangeSinceStart(logs);
  const hasToday = loggedToday(logs, todayISO());
  const todayValue = hasToday ? logs.at(-1)!.weight_kg : undefined;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-100">Bodyweight</h2>
          <p className="text-xs text-zinc-500">
            {logs.length} {logs.length === 1 ? "entry" : "entries"} logged
          </p>
        </div>
        {latest != null && (
          <div className="text-right">
            <p className="text-xl font-bold text-zinc-100">{latest}kg</p>
            {change != null && change !== 0 && (
              <p className="text-xs text-zinc-500">
                {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}kg since first log
              </p>
            )}
          </div>
        )}
      </div>

      <ProgressChart points={history} unit="kg" />

      <form
        action={formAction}
        key={state?.status === "success" ? "done" : "editing"}
        className="flex items-end gap-2 border-t border-slate-700 pt-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="weightKg" className="text-xs text-zinc-500">
            {hasToday ? "Update today's weight" : "Log today's weight"}
          </label>
          <div className="flex items-center gap-1">
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              min={20}
              max={300}
              step={0.1}
              defaultValue={todayValue}
              required
              className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-400"
            />
            <span className="text-sm text-zinc-500">kg</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {pending && <SpinnerIcon className="h-3.5 w-3.5" />}
          Save
        </button>
      </form>
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
    </div>
  );
}
