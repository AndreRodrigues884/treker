"use client";

/** A single earned personal record, shown as its own centered modal —
 * same reasoning and look as Gym's AchievementsModal, just generic
 * enough for Running/Swimming's one-line messages instead of a list. */
export function PrModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-800 p-5 shadow-2xl">
        <h2 className="text-base font-bold text-zinc-100">New personal record!</h2>
        <p className="mt-3 text-sm text-amber-300">🎉 {message}</p>
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
