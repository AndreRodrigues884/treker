"use client";

import { useState, useTransition } from "react";
import {
  clearRunningGoalAction,
  setRunningGoalAction,
} from "@/lib/actions/running";
import { formatDuration, runningGoalProgress } from "@/lib/running/derive";
import type { StandardDistance } from "@/lib/constants/running";
import type { ProgressPoint } from "@/lib/gym/derive";
import type { RunningGoal } from "@/types/running";
import { PencilIcon, SpinnerIcon, TrashIcon } from "@/components/ui/icons";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

/** Mirrors Swimming's SwimGoalCard — same layout, same linear-trend
 * progress/ETA — adapted for standard distances (keyed by
 * distance_value, not stroke+distance) and hours+minutes+seconds goal
 * times, since a marathon target is several hours, not under a
 * minute. */
export function RunningGoalCard({
  distance,
  history,
  goal,
}: {
  distance: StandardDistance;
  history: ProgressPoint[];
  goal: RunningGoal | null;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDeleteConfirmed() {
    startTransition(async () => {
      await clearRunningGoalAction(distance.value);
      setConfirmingDelete(false);
    });
  }

  if (!goal || editing) {
    return (
      <GoalEditor
        distance={distance}
        goal={goal}
        pending={pending}
        onCancel={goal ? () => setEditing(false) : undefined}
        onSave={(hours, minutes, seconds) => {
          startTransition(async () => {
            await setRunningGoalAction(distance.value, hours, minutes, seconds);
            setEditing(false);
          });
        }}
      />
    );
  }

  const progress = runningGoalProgress(history, Number(goal.target_seconds));
  if (!progress) {
    return (
      <GoalEditor
        distance={distance}
        goal={goal}
        pending={pending}
        onSave={(hours, minutes, seconds) => {
          startTransition(async () => {
            await setRunningGoalAction(distance.value, hours, minutes, seconds);
          });
        }}
      />
    );
  }

  const {
    targetSeconds,
    startSeconds,
    latestSeconds,
    progressPct,
    improvementSinceStart,
    paceSecondsPerWeek,
    improving,
    etaDate,
  } = progress;

  const remaining = latestSeconds - targetSeconds;
  const reached = remaining <= 0;

  return (
    <div className="space-y-3 border-t border-slate-700 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Progress to goal</p>
          <p className="text-xs text-zinc-500">
            {formatDuration(startSeconds)} → {formatDuration(targetSeconds)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reached ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Goal reached
            </span>
          ) : (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                improving
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {improving ? "Improving" : "Off pace"}
            </span>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit goal"
            className="text-zinc-500 hover:text-zinc-300"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingDelete(true)}
            aria-label="Remove goal"
            className="text-zinc-500 hover:text-red-400 disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-2 rounded-full bg-linear-to-r from-emerald-400 to-teal-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500">{progressPct.toFixed(1)}%</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Current pace"
          value={formatDuration(latestSeconds)}
          sub={reached ? "goal reached" : `${formatDuration(remaining)} to go`}
        />
        <Stat
          label="Total improvement"
          value={`${improvementSinceStart <= 0 ? "" : "+"}${formatDuration(Math.abs(improvementSinceStart))}`}
          sub="since first log"
          tone={improvementSinceStart < 0 ? "good" : improvementSinceStart > 0 ? "bad" : undefined}
        />
        <Stat
          label="Pace/week"
          value={paceSecondsPerWeek == null ? "—" : formatDuration(Math.abs(paceSecondsPerWeek))}
          sub={
            paceSecondsPerWeek == null
              ? "need 2+ sessions"
              : improving
                ? "improving"
                : "worsening"
          }
          tone={paceSecondsPerWeek == null ? undefined : improving ? "good" : "bad"}
        />
        <Stat
          label="ETA"
          value={etaDate ? monthYear.format(new Date(etaDate)) : "—"}
          sub={reached ? "goal reached" : etaDate ? "linear estimate" : "not on pace"}
        />
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="Remove goal?"
          message={`This removes the ${formatDuration(targetSeconds)} goal for ${distance.label}. You can set a new one any time.`}
          confirmLabel="Remove"
          pending={pending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-bold text-zinc-100">{value}</p>
      <p
        className={`text-xs ${
          tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : "text-zinc-500"
        }`}
      >
        {sub}
      </p>
    </div>
  );
}

function GoalEditor({
  distance,
  goal,
  pending,
  onSave,
  onCancel,
}: {
  distance: StandardDistance;
  goal: RunningGoal | null;
  pending: boolean;
  onSave: (hours: number, minutes: number, seconds: number) => void;
  onCancel?: () => void;
}) {
  const initial = goal ? Number(goal.target_seconds) : 0;
  const [hours, setHours] = useState(Math.floor(initial / 3600));
  const [minutes, setMinutes] = useState(Math.floor((initial % 3600) / 60));
  const [seconds, setSeconds] = useState(Math.round(initial % 60));

  return (
    <div className="space-y-2 border-t border-dashed border-slate-700 pt-4">
      <p className="text-sm font-medium text-zinc-300">
        {goal ? "Edit goal time" : `Set a goal time for ${distance.label}`}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-zinc-500">Hours</label>
          <input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-emerald-400"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-zinc-500">Minutes</label>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-emerald-400"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-zinc-500">Seconds</label>
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-emerald-400"
          />
        </div>
        <button
          type="button"
          disabled={pending || (hours <= 0 && minutes <= 0 && seconds <= 0)}
          onClick={() => onSave(hours, minutes, seconds)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-40"
        >
          {pending && <SpinnerIcon className="h-3.5 w-3.5" />}
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
