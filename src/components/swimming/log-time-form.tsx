"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { logSwimTimeAction, type SwimFormResult } from "@/lib/actions/swimming";
import { SWIM_STROKES, SWIM_DISTANCES, type SwimStroke } from "@/lib/constants/swimming";
import { formatSwimTime, swimPacePer100m } from "@/lib/swimming/derive";
import { SpinnerIcon } from "@/components/ui/icons";
import { PrModal } from "@/components/ui/pr-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const initialState: SwimFormResult = null;

type Preview = { stroke: SwimStroke; distanceM: number; timeSeconds: number };

/** Logs one time for one event (stroke + distance) — a single atomic
 * entry, so unlike Gym's set-logging this submits straight away instead
 * of staging locally first; there's nothing to accidentally half-fill
 * across multiple sets. */
export function LogTimeForm() {
  const [state, formAction, pending] = useActionState(logSwimTimeAction, initialState);
  const [stroke, setStroke] = useState<SwimStroke>("freestyle");
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
  // "13m 51.00s" format the rest of the app reads, alongside the
  // resulting pace/100m — catches that kind of mistake (an implausible
  // pace) before it ever reaches the database.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (skipConfirm.current) {
      skipConfirm.current = false;
      return;
    }
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const distanceM = Number(data.get("distanceM"));
    const minutes = Number(data.get("minutes"));
    const seconds = Number(data.get("seconds"));
    setPreview({ stroke, distanceM, timeSeconds: minutes * 60 + seconds });
  }

  function handleConfirmSave() {
    setPreview(null);
    skipConfirm.current = true;
    formRef.current?.requestSubmit();
  }

  const strokeLabel = preview
    ? SWIM_STROKES.find((s) => s.value === preview.stroke)?.label ?? preview.stroke
    : "";

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
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

      {preview && (
        <ConfirmModal
          title="Confirm this time"
          message={`${preview.distanceM}m ${strokeLabel} in ${formatSwimTime(preview.timeSeconds)} (pace ${formatSwimTime(swimPacePer100m(preview.timeSeconds, preview.distanceM))}/100m). Does that look right?`}
          confirmLabel="Save"
          cancelLabel="Edit"
          onConfirm={handleConfirmSave}
          onCancel={() => setPreview(null)}
        />
      )}

      {showPr && state?.status === "success" && state.pr && (
        <PrModal
          message={`${state.pr.distanceM}m ${state.pr.stroke} in ${formatSwimTime(state.pr.timeSeconds)} — your fastest yet.`}
          onClose={() => setShowPr(false)}
        />
      )}
    </>
  );
}
