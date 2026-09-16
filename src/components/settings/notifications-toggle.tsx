"use client";

import { useState, useTransition } from "react";
import { updateNotificationsAction } from "@/lib/actions/profile";
import { BellIcon, SpinnerIcon } from "@/components/ui/icons";

/** A straight on/off preference — there's no notification-sending system
 * behind this yet, so flipping it just records the choice on the account
 * for when there is one. Saves instantly on click, no separate submit. */
export function NotificationsToggle({
  defaultEnabled,
}: {
  defaultEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      try {
        await updateNotificationsAction(next);
      } catch {
        setEnabled(!next);
        setError("Couldn't save that — try again.");
      }
    });
  }

  return (
    <div className="max-w-sm space-y-3">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
            <BellIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-100">
              Training reminders
            </p>
            <p className="text-xs text-zinc-500">
              Email nudges about upcoming sessions and streaks.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle training reminders"
          onClick={handleToggle}
          disabled={pending}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
            enabled ? "bg-indigo-500" : "bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
              enabled ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {pending && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <SpinnerIcon className="h-3.5 w-3.5" /> Saving…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
