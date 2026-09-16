"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, LaptopIcon } from "@/components/ui/icons";

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: LaptopIcon },
] as const;

/** Wires up the light/dark/system choice and persists it (next-themes
 * handles that via localStorage) — the app's own visuals are still
 * dark-only for now, so this is the toggle infrastructure, not a full
 * light theme yet. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the real value after mount (it reads
  // localStorage client-side) — rendering a guess during SSR would
  // mismatch on hydration, so this starts unmounted and swaps in once
  // ready, same pattern as the dashboard greeting.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="max-w-sm space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const active = mounted && theme === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                active
                  ? "border-indigo-400 bg-indigo-500/10 text-white"
                  : "border-slate-700 text-zinc-400 hover:border-slate-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">
        Treker is dark-first end to end right now, so Light won&apos;t change
        much yet — your choice is saved either way, ready for when the
        light theme lands.
      </p>
    </div>
  );
}
