"use client";

import { useState } from "react";

const ACCENT_CLASSES = {
  emerald: "border-emerald-400 bg-emerald-500/10 text-emerald-300",
  indigo: "border-indigo-400 bg-indigo-500/10 text-indigo-300",
} as const;

/** Splits a modality page's charts from its raw log list into two
 * explicit tabs instead of stacking both in one long scroll — both are
 * rendered up front (already resolved server-side) and just shown/
 * hidden here, same "instant switch, no refetch" convention as
 * StatisticsFilter. */
export function SectionTabs({
  progress,
  recent,
  recentLabel,
  accent,
}: {
  progress: React.ReactNode;
  recent: React.ReactNode;
  recentLabel: string;
  accent: keyof typeof ACCENT_CLASSES;
}) {
  const [tab, setTab] = useState<"progress" | "recent">("progress");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("progress")}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            tab === "progress"
              ? ACCENT_CLASSES[accent]
              : "border-slate-700 text-zinc-400 hover:border-slate-500"
          }`}
        >
          Progress
        </button>
        <button
          type="button"
          onClick={() => setTab("recent")}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            tab === "recent"
              ? ACCENT_CLASSES[accent]
              : "border-slate-700 text-zinc-400 hover:border-slate-500"
          }`}
        >
          {recentLabel}
        </button>
      </div>

      <div hidden={tab !== "progress"} className="space-y-3">
        {progress}
      </div>
      <div hidden={tab !== "recent"}>{recent}</div>
    </div>
  );
}
