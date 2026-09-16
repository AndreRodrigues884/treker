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

/**
 * Two-step wizard: sports, then goals. Designed to fit one mobile
 * viewport with no vertical scroll — the parent page gives this a
 * bounded height (h-dvh), and this component fills it (h-full) with a
 * fixed header/nav and a flexible, centered middle section.
 *
 * Navigating between steps is purely client-side; the values are also
 * mirrored into hidden inputs (not the visible toggle buttons), so the
 * final submit always carries both steps' selections regardless of
 * which one is currently on screen.
 */
export function OnboardingWizard({
  defaultModalities = [],
  defaultGoals = [],
}: {
  defaultModalities?: Modality[];
  defaultGoals?: TrainingGoal[];
}) {
  const [step, setStep] = useState<0 | 1>(0);
  const [modalities, setModalities] = useState<Modality[]>(defaultModalities);
  const [goals, setGoals] = useState<TrainingGoal[]>(defaultGoals);
  const [state, formAction, pending] = useActionState(
    saveOnboardingAction,
    initialState,
  );

  const onSportsStep = step === 0;

  return (
    <form action={formAction} className="flex h-full flex-col">
      {modalities.map((m) => (
        <input key={m} type="hidden" name="modalities" value={m} />
      ))}
      {goals.map((g) => (
        <input key={g} type="hidden" name="goals" value={g} />
      ))}

      <div className="flex shrink-0 items-center justify-center gap-2 pb-2">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-9 rounded-full transition-colors ${
              i === step
                ? "bg-indigo-400"
                : i < step
                  ? "bg-indigo-400/50"
                  : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 text-center">
        {onSportsStep ? (
          <>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold sm:text-2xl">
                Sports you&apos;ll track
              </h1>
              <p className="text-sm text-zinc-400">
                Pick at least one — change this anytime later.
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-3">
              {MODALITIES.map((m) => (
                <ToggleCard
                  key={m.value}
                  selected={modalities.includes(m.value)}
                  onClick={() => setModalities(toggle(modalities, m.value))}
                  icon={m.icon}
                  className="py-5"
                >
                  {m.label}
                </ToggleCard>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold sm:text-2xl">Your goals</h1>
              <p className="text-sm text-zinc-400">
                What are you training for?
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-3">
              {TRAINING_GOALS.map((g, i) => (
                <ToggleCard
                  key={g.value}
                  selected={goals.includes(g.value)}
                  onClick={() => setGoals(toggle(goals, g.value))}
                  icon={g.icon}
                  className={`py-3.5 ${
                    i === TRAINING_GOALS.length - 1 &&
                    TRAINING_GOALS.length % 2 === 1
                      ? "col-span-2"
                      : ""
                  }`}
                >
                  {g.label}
                </ToggleCard>
              ))}
            </div>
          </>
        )}
      </div>

      {state?.status === "error" && (
        <p
          role="alert"
          className="mb-3 shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400"
        >
          {state.message}
        </p>
      )}

      <div className="flex shrink-0 gap-3">
        {!onSportsStep && (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-slate-500"
          >
            Back
          </button>
        )}
        {onSportsStep ? (
          <button
            type="button"
            disabled={modalities.length === 0}
            onClick={() => setStep(1)}
            className="flex-1 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending || goals.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {pending && <SpinnerIcon className="h-4 w-4" />}
            {pending ? "Saving…" : "Get started"}
          </button>
        )}
      </div>
    </form>
  );
}
