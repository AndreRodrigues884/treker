"use client";

/** Confirm dialog shown when navigating away from an unsaved workout
 * session — mirrors the reference LeaveModal, restyled to match our dark
 * glass-card look. */
export function LeaveModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
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
        <h2 className="text-base font-bold text-zinc-100">
          Leave without saving?
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          You have logged sets that haven&apos;t been saved yet. Leaving now
          will discard them.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-slate-500"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
          >
            Discard &amp; leave
          </button>
        </div>
      </div>
    </div>
  );
}
