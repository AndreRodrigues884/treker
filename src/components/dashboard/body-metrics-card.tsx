"use client";

import { useActionState } from "react";
import { updateBodyMetricsAction, type ProfileResult } from "@/lib/actions/profile";
import { SpinnerIcon } from "@/components/ui/icons";

const initialState: ProfileResult = null;

/** A single current value for bodyweight/height — not a log or chart
 * (that feature was removed, it wasn't wanted). Exists purely so
 * exercises marked "adds bodyweight" (weighted pull-ups, weighted
 * dips…) can compute a real 1RM: the logged weight there is only part
 * of what's actually being lifted. Edit anytime; nothing is kept once
 * overwritten. */
export function BodyMetricsCard({
  bodyweightKg,
  heightCm,
}: {
  bodyweightKg: number | null;
  heightCm: number | null;
}) {
  const [state, formAction, pending] = useActionState(updateBodyMetricsAction, initialState);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Body Metrics</h2>
        <p className="text-xs text-zinc-500">
          Used for an accurate 1RM on weighted bodyweight exercises (e.g. weighted pull-ups)
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="bodyweightKg" className="text-xs text-zinc-500">
              Bodyweight (kg)
            </label>
            <input
              id="bodyweightKg"
              name="bodyweightKg"
              type="number"
              min={20}
              max={400}
              step={0.1}
              defaultValue={bodyweightKg ?? undefined}
              placeholder="—"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-400"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="heightCm" className="text-xs text-zinc-500">
              Height (cm)
            </label>
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              min={50}
              max={272}
              step={0.5}
              defaultValue={heightCm ?? undefined}
              placeholder="—"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-400"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
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
      {state?.status === "success" && (
        <p role="status" className="text-sm text-emerald-400">
          Saved.
        </p>
      )}
    </div>
  );
}
