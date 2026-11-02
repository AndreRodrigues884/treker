import { BellIcon } from "@/components/ui/icons";

/** Static and disabled on purpose — there's no notification-sending
 * system behind this yet, so a working-looking toggle that silently
 * saves a preference nothing ever reads was actively misleading (the
 * user would reasonably expect reminders to start arriving). Comes
 * back as a real switch once there's something to turn on. */
export function NotificationsToggle() {
  return (
    <div className="max-w-sm space-y-2">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-800/40 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
            <BellIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
              Training reminders
              <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                Soon
              </span>
            </p>
            <p className="text-xs text-zinc-500">
              Email nudges about upcoming sessions and streaks — not built yet.
            </p>
          </div>
        </div>
        <span
          role="switch"
          aria-checked={false}
          aria-label="Training reminders (coming soon)"
          aria-disabled="true"
          className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-slate-600"
        >
          <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow" />
        </span>
      </div>
    </div>
  );
}
