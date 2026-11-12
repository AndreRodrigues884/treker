"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { useWorkoutSession } from "@/components/gym/session-context";
import { saveSessionAction, type GymFormResult, type PrAchieved } from "@/lib/actions/gym";
import { SpinnerIcon } from "@/components/ui/icons";
import type { MuscleGroup } from "@/lib/constants/gym";

const FORM_ID = "save-session-form";

export function SaveSessionButton({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const { pending, clearPending } = useWorkoutSession();
  const count = Object.keys(pending).length;

  const [state, formAction, isPending] = useActionState(
    async (prevState: GymFormResult, formData: FormData) => {
      const result = await saveSessionAction(muscleGroup, pending, prevState, formData);
      if (result?.status === "success") clearPending();
      return result;
    },
    null,
  );

  // Intercepting a real <form> submit (rather than putting the confirm
  // before a plain onClick) means both "Save session" buttons — the
  // header one and the fixed mobile one, which targets this same form
  // by id from outside it — go through one single check, instead of
  // needing the same logic wired twice. skipConfirm is set right
  // before requestSubmit() below, so that second, real submit event
  // passes straight through instead of re-opening the modal.
  const formRef = useRef<HTMLFormElement>(null);
  const skipConfirm = useRef(false);
  const [confirmingSave, setConfirmingSave] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (skipConfirm.current) {
      skipConfirm.current = false;
      return;
    }
    e.preventDefault();
    setConfirmingSave(true);
  }

  function handleConfirmSave() {
    setConfirmingSave(false);
    skipConfirm.current = true;
    formRef.current?.requestSubmit();
  }

  // Discarding is purely local — nothing was ever written to the
  // database, so there's nothing to delete server-side. Clearing
  // `pending` also wipes session-context.tsx's own localStorage backup
  // for this muscle group (the effect that mirrors it there runs on
  // every change, including down to empty).
  function handleDiscard() {
    setConfirmingSave(false);
    clearPending();
  }

  // Each successful save produces a new `state` object — reacting to
  // that identity change during render (not in an effect) opens the
  // modal exactly once per save that earned something. The modal's own
  // "Done" button is what closes it after that.
  const [lastState, setLastState] = useState(state);
  const [showAchievements, setShowAchievements] = useState(false);
  if (state !== lastState) {
    setLastState(state);
    setShowAchievements(
      state?.status === "success" &&
        ((state.prs?.length ?? 0) > 0 || (state.milestonesKg?.length ?? 0) > 0),
    );
  }

  return (
    <>
      <form
        id={FORM_ID}
        ref={formRef}
        onSubmit={handleSubmit}
        action={formAction}
        className="flex flex-col items-end gap-2"
      >
        <button
          type="submit"
          disabled={isPending || count === 0}
          className="hidden items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-40 md:flex"
        >
          {isPending && <SpinnerIcon className="h-4 w-4" />}
          {isPending ? "Saving…" : "Save session"}
        </button>
        {state?.status === "error" && (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        )}
        {state?.status === "success" && state.warning && (
          <p role="alert" className="text-sm text-amber-400">
            {state.warning}
          </p>
        )}
      </form>

      {/* A second submit button for the same form (HTML allows a
       * button to target a form by id from anywhere in the DOM) — the
       * only "Save session" control on mobile (the one above is
       * md:flex, hidden below that breakpoint), fixed to the bottom and
       * only shown once there's actually something staged, so it can't
       * be scrolled out of view while working through a long exercise
       * list. This is what was really behind a user losing a whole
       * session: not that the header button was too small, but that it
       * had scrolled off-screen by the time they finished their last
       * set. */}
      {count > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-slate-900/95 p-3 backdrop-blur-sm md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="submit"
            form={FORM_ID}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-40"
          >
            {isPending && <SpinnerIcon className="h-4 w-4" />}
            {isPending ? "Saving…" : "Save session"}
          </button>
        </div>
      )}

      {confirmingSave && (
        <SaveSessionConfirmModal
          count={count}
          onConfirmSave={handleConfirmSave}
          onDiscard={handleDiscard}
          onCancel={() => setConfirmingSave(false)}
        />
      )}

      {showAchievements && state?.status === "success" && (
        <AchievementsModal
          prs={state.prs ?? []}
          milestonesKg={state.milestonesKg ?? []}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </>
  );
}

/** A deliberate stop between "Save session" and it actually happening
 * — gives a way out other than saving, for a session the user decides
 * they don't actually want kept. Discard is immediate, no nested
 * confirmation: picking it from this already-deliberate list of
 * options is itself the confirmation, and it only ever throws away a
 * local draft that was never written anywhere. */
function SaveSessionConfirmModal({
  count,
  onConfirmSave,
  onDiscard,
  onCancel,
}: {
  count: number;
  onConfirmSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl">
        <h2 className="text-base font-bold text-zinc-100">Save session?</h2>
        <p className="mt-1 text-sm text-zinc-400">
          You&apos;ve logged {count} {count === 1 ? "set" : "sets"}. Save them to your
          history, or discard this session if you&apos;ve changed your mind — that can&apos;t
          be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Discard session
          </button>
          <button
            type="button"
            onClick={onConfirmSave}
            className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
          >
            Yes, save
          </button>
        </div>
      </div>
    </div>
  );
}

/** Real, earned recognition — a genuine PR or lifetime-volume milestone,
 * not an invented game mechanic — shown as its own centered modal
 * instead of an inline banner so it can't crowd or misalign the header
 * it used to live in. */
function AchievementsModal({
  prs,
  milestonesKg,
  onClose,
}: {
  prs: PrAchieved[];
  milestonesKg: number[];
  onClose: () => void;
}) {
  const title = prs.length > 0 ? "PRs achieved this session" : "Milestone reached!";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-800 p-5 shadow-2xl">
        <h2 className="text-base font-bold text-zinc-100">{title}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {prs.map((pr, i) => (
            <li key={`pr-${i}`} className="text-amber-300">
              🎉{" "}
              <span className="font-semibold text-amber-200">{pr.exerciseName}</span>{" "}
              — {pr.weightKg}kg × {pr.reps} (1RM est. {pr.oneRepMax.toFixed(1)}kg)
            </li>
          ))}
          {milestonesKg.map((kg) => (
            <li key={`milestone-${kg}`} className="text-amber-300">
              🏆 {kg.toLocaleString()}kg lifted in total
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
        >
          Done
        </button>
      </div>
    </div>
  );
}
