"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { logRunAction, type RunFormResult } from "@/lib/actions/running";
import { STANDARD_DISTANCES } from "@/lib/constants/running";
import { formatDuration, formatPace } from "@/lib/running/derive";
import { SpinnerIcon } from "@/components/ui/icons";
import { PrModal } from "@/components/ui/pr-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const initialState: RunFormResult = null;

type Preview = { distanceKm: number; totalSeconds: number };

/** A single run is one atomic entry (distance + duration) — no forced
 * picker step like Swimming's stroke/distance, since most training runs
 * land on an odd number (8.27km, not a round one). The quick-distance
 * dropdown is just a convenience that fills the free field; it isn't a
 * separate value, so a run picked from it behaves exactly like one
 * typed by hand. */
export function LogRunForm() {
  const [state, formAction, pending] = useActionState(logRunAction, initialState);
  const [distanceKm, setDistanceKm] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  // Set right before requestSubmit() below, so the resulting (second)
  // submit event skips the confirmation and actually reaches the
  // server action. The browser only fires `submit` once native
  // constraint validation (required/min/max) already passed, so by the
  // time handleSubmit runs the fields below are safe to read as-is.
  const skipConfirm = useRef(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  // Reacting to a new `state` identity during render (not an effect)
  // opens the modal exactly once per save that earned a PR — same
  // pattern as Gym's SaveSessionButton.
  const [lastState, setLastState] = useState(state);
  const [showPr, setShowPr] = useState(false);
  if (state !== lastState) {
    setLastState(state);
    setShowPr(state?.status === "success" && state.pr != null);
  }

  // A real report: a 25m/13.51s swim got logged as 13 minutes 51
  // seconds by mistake (minutes/seconds mixed up), and the user had no
  // way to undo it short of editing the database directly. Showing the
  // parsed value back before it's saved — in the same unambiguous
  // "23:45" / pace format the rest of the app reads — catches that kind
  // of mistake (an implausible pace) before it ever reaches the
  // database, same reasoning applied to Swimming's LogTimeForm below.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (skipConfirm.current) {
      skipConfirm.current = false;
      return;
    }
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const distance = Number(data.get("distanceKm"));
    const hours = Number(data.get("hours"));
    const minutes = Number(data.get("minutes"));
    const seconds = Number(data.get("seconds"));
    setPreview({ distanceKm: distance, totalSeconds: hours * 3600 + minutes * 60 + seconds });
  }

  function handleConfirmSave() {
    setPreview(null);
    skipConfirm.current = true;
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        key={state?.status === "success" ? "done" : "editing"}
        className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4"
      >
        <div className="space-y-1">
          <label htmlFor="distanceKm" className="text-sm text-zinc-400">
            Distance (km)
          </label>
          <div className="flex gap-2">
            <input
              id="distanceKm"
              name="distanceKm"
              type="number"
              min={0.01}
              max={500}
              step={0.01}
              placeholder="5.00"
              required
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-400"
            />
            <select
              aria-label="Quick-pick a standard distance"
              value=""
              onChange={(e) => {
                if (e.target.value) setDistanceKm(e.target.value);
              }}
              className="w-32 shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            >
              <option value="">Quick pick…</option>
              {STANDARD_DISTANCES.map((d) => (
                <option key={d.value} value={d.km}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor="hours" className="text-sm text-zinc-400">
              Hours
            </label>
            <input
              id="hours"
              name="hours"
              type="number"
              min={0}
              max={23}
              defaultValue={0}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            />
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
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
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
              max={59}
              defaultValue={0}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
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
            Run logged.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending && <SpinnerIcon className="h-4 w-4" />}
          {pending ? "Saving…" : "Log run"}
        </button>
      </form>

      {preview && (
        <ConfirmModal
          title="Confirm this run"
          message={`${preview.distanceKm}km in ${formatDuration(preview.totalSeconds)} (pace ${formatPace(preview.totalSeconds / preview.distanceKm)}). Does that look right?`}
          confirmLabel="Save"
          cancelLabel="Edit"
          onConfirm={handleConfirmSave}
          onCancel={() => setPreview(null)}
        />
      )}

      {showPr && state?.status === "success" && state.pr && (
        <PrModal
          message={`${state.pr.distanceLabel} in ${formatDuration(state.pr.durationSeconds)} — your fastest yet.`}
          onClose={() => setShowPr(false)}
        />
      )}
    </>
  );
}
