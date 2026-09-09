"use client";

import { useActionState, useState } from "react";
import {
  MODALITIES,
  TRAINING_GOALS,
  type Modality,
  type TrainingGoal,
} from "@/lib/constants/onboarding";
import {
  saveOnboardingAction,
  type OnboardingResult,
} from "@/lib/actions/onboarding";

const initialState: OnboardingResult = null;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function OnboardingForm({
  defaultModalities = [],
  defaultGoals = [],
  submitLabel = "Continue",
}: {
  defaultModalities?: Modality[];
  defaultGoals?: TrainingGoal[];
  submitLabel?: string;
}) {
  const [modalities, setModalities] = useState<Modality[]>(defaultModalities);
  const [goals, setGoals] = useState<TrainingGoal[]>(defaultGoals);
  const [state, formAction, pending] = useActionState(
    saveOnboardingAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-zinc-100">
          Sports you&apos;ll track
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODALITIES.map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm transition ${
                modalities.includes(m.value)
                  ? "border-indigo-400 bg-indigo-500/10 text-white"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <input
                type="checkbox"
                name="modalities"
                value={m.value}
                checked={modalities.includes(m.value)}
                onChange={() => setModalities(toggle(modalities, m.value))}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-zinc-100">
          Your goals
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRAINING_GOALS.map((g) => (
            <label
              key={g.value}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                goals.includes(g.value)
                  ? "border-indigo-400 bg-indigo-500/10 text-white"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <input
                type="checkbox"
                name="goals"
                value={g.value}
                checked={goals.includes(g.value)}
                onChange={() => setGoals(toggle(goals, g.value))}
                className="sr-only"
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || modalities.length === 0 || goals.length === 0}
        className="w-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-8 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
