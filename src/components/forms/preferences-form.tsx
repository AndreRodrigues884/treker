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
import { SpinnerIcon } from "@/components/ui/icons";
import { ToggleCard } from "@/components/ui/toggle-card";

const initialState: OnboardingResult = null;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

/** Same choices as the onboarding wizard, shown as one page (not a
 * stepper) — this is an edit form on Settings, not a first-run flow. */
export function PreferencesForm({
  defaultModalities = [],
  defaultGoals = [],
}: {
  defaultModalities?: Modality[];
  defaultGoals?: TrainingGoal[];
}) {
  const [modalities, setModalities] = useState<Modality[]>(defaultModalities);
  const [goals, setGoals] = useState<TrainingGoal[]>(defaultGoals);
  const [state, formAction, pending] = useActionState(
    saveOnboardingAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      {modalities.map((m) => (
        <input key={m} type="hidden" name="modalities" value={m} />
      ))}
      {goals.map((g) => (
        <input key={g} type="hidden" name="goals" value={g} />
      ))}

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-zinc-100">
          Sports you&apos;ll track
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {MODALITIES.map((m) => (
            <ToggleCard
              key={m.value}
              selected={modalities.includes(m.value)}
              onClick={() => setModalities(toggle(modalities, m.value))}
              className="py-3"
            >
              {m.label}
            </ToggleCard>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-zinc-100">
          Your goals
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {TRAINING_GOALS.map((g) => (
            <ToggleCard
              key={g.value}
              selected={goals.includes(g.value)}
              onClick={() => setGoals(toggle(goals, g.value))}
              className="py-3"
            >
              {g.label}
            </ToggleCard>
          ))}
        </div>
      </fieldset>

      {state?.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || modalities.length === 0 || goals.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-8 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
