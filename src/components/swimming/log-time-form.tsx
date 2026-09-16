"use client";

import { useActionState, useState } from "react";
import { logSwimTimeAction, type SwimFormResult } from "@/lib/actions/swimming";
import { SWIM_STROKES, SWIM_DISTANCES, type SwimStroke } from "@/lib/constants/swimming";
import { SpinnerIcon } from "@/components/ui/icons";

const initialState: SwimFormResult = null;

/** Logs one time for one event (stroke + distance) — a single atomic
 * entry, so unlike Gym's set-logging this submits straight away instead
 * of staging locally first; there's nothing to accidentally half-fill
 * across multiple sets. */
export function LogTimeForm() {
  const [state, formAction, pending] = useActionState(logSwimTimeAction, initialState);
  const [stroke, setStroke] = useState<SwimStroke>("freestyle");

  return (
    <form
      action={formAction}
      key={state?.status === "success" ? "done" : "editing"}
      className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4"
    >
      <input type="hidden" name="stroke" value={stroke} />

      <div className="space-y-1">
        <span className="text-sm text-zinc-400">Stroke</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SWIM_STROKES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStroke(s.value)}
              aria-pressed={stroke === s.value}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm transition ${
                stroke === s.value
                  ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
                  : "border-slate-700 text-zinc-400 hover:border-slate-500"
              }`}
            >
              <span aria-hidden>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="distanceM" className="text-sm text-zinc-400">
            Distance
          </label>
          <select
            id="distanceM"
            name="distanceM"
            defaultValue={100}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
          >
            {SWIM_DISTANCES.map((d) => (
              <option key={d} value={d}>
                {d}m
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="minutes" className="text-sm text-zinc-400">
            Minutes
          </label>
          <input
            id="minutes"
            name="minutes"
            type="number"
            min={0}
            max={59}
            defaultValue={0}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="seconds" className="text-sm text-zinc-400">
            Seconds
          </label>
          <input
            id="seconds"
            name="seconds"
            type="number"
            min={0}
            max={59.99}
            step={0.01}
            placeholder="0.00"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-400"
          />
        </div>
      </div>

      {state?.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
      {state?.status === "success" && (
        <p role="status" className="text-sm text-emerald-400">
          Time logged.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? "Saving…" : "Log time"}
      </button>
    </form>
  );
}
