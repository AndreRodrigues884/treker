import { MoonIcon, SunIcon, LaptopIcon } from "@/components/ui/icons";

/** Dark is the only real option — Treker is dark-only end to end right
 * now, so Light/System would silently do nothing if clicked. Showing
 * them as live, clickable choices (the old next-themes-backed toggle)
 * was misleading: picking "Light" visibly changed nothing. They stay
 * visible but disabled with a "Soon" tag instead, so the intent is
 * clear without pretending there's a working theme switch today. */
export function ThemeToggle() {
  return (
    <div className="max-w-sm space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-indigo-400 bg-indigo-500/10 px-3 py-3 text-sm font-medium text-white">
          <MoonIcon className="h-5 w-5" />
          Dark
        </div>
        <div
          aria-disabled="true"
          className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-2xl border border-slate-700 px-3 py-3 text-sm font-medium text-zinc-600"
        >
          <SunIcon className="h-5 w-5" />
          Light
          <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
            Soon
          </span>
        </div>
        <div
          aria-disabled="true"
          className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-2xl border border-slate-700 px-3 py-3 text-sm font-medium text-zinc-600"
        >
          <LaptopIcon className="h-5 w-5" />
          System
          <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
            Soon
          </span>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Treker is dark-only for now — Light and System will come online once a
        light theme actually exists to switch to.
      </p>
    </div>
  );
}
