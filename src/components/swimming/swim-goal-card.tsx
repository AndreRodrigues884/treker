"use client";

import { useState, useTransition } from "react";
import {
  clearSwimGoalAction,
  setSwimGoalAction,
} from "@/lib/actions/swimming";
import { formatSwimTime, swimGoalProgress, type SwimEvent } from "@/lib/swimming/derive";
import type { ProgressPoint } from "@/lib/gym/derive";
import type { SwimGoal } from "@/types/swimming";
import { PencilIcon, SpinnerIcon, TrashIcon } from "@/components/ui/icons";

const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

export function SwimGoalCard({
  event,
  history,
  goal,
}: {
  event: SwimEvent;
  history: ProgressPoint[];
  goal: SwimGoal | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!goal || editing) {
    return (
      <GoalEditor
        event={event}
        goal={goal}
        pending={pending}
        onCancel={goal ? () => setEditing(false) : undefined}
        onSave={(minutes, seconds) => {
          startTransition(async () => {
            await setSwimGoalAction(event.stroke, event.distanceM, minutes, seconds);
            setEditing(false);
          });
        }}
      />
    );
  }

  const progress = swimGoalProgress(history, Number(goal.target_seconds));
  if (!progress) {
    return (
      <GoalEditor
        event={event}
        goal={goal}
        pending={pending}
        onSave={(minutes, seconds) => {
          startTransition(async () => {
            await setSwimGoalAction(event.stroke, event.distanceM, minutes, seconds);
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
    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Progress to goal</p>
          <p className="text-xs text-zinc-500">
            {formatSwimTime(startSeconds)} → {formatSwimTime(targetSeconds)}
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
            onClick={() =>
              startTransition(() => clearSwimGoalAction(event.stroke, event.distanceM))
            }
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
            className="h-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500">{progressPct.toFixed(1)}%</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Last time"
          value={formatSwimTime(latestSeconds)}
          sub={reached ? "goal reached" : `${remaining.toFixed(2)}s to go`}
        />
        <Stat
          label="Total improvement"
          value={`${improvementSinceStart <= 0 ? "" : "+"}${improvementSinceStart.toFixed(2)}s`}
          sub="since first log"
          tone={improvementSinceStart < 0 ? "good" : improvementSinceStart > 0 ? "bad" : undefined}
        />
        <Stat
          label="Pace/week"
          value={paceSecondsPerWeek == null ? "—" : `${Math.abs(paceSecondsPerWeek).toFixed(3)}s`}
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
  event,
  goal,
  pending,
  onSave,
  onCancel,
}: {
  event: SwimEvent;
  goal: SwimGoal | null;
  pending: boolean;
  onSave: (minutes: number, seconds: number) => void;
  onCancel?: () => void;
}) {
  const initial = goal ? Number(goal.target_seconds) : 0;
  const [minutes, setMinutes] = useState(Math.floor(initial / 60));
  const [seconds, setSeconds] = useState(Number((initial % 60).toFixed(2)));

  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-4">
      <p className="text-sm font-medium text-zinc-300">
        {goal ? "Edit goal time" : `Set a goal time for ${event.distanceM}m`}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Minutes</label>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-cyan-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Seconds</label>
          <input
            type="number"
            min={0}
            max={59.99}
            step={0.01}
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="button"
          disabled={pending || (minutes <= 0 && seconds <= 0)}
          onClick={() => onSave(minutes, seconds)}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-40"
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
