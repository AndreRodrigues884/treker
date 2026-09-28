"use client";

import { useState } from "react";
import type { Modality } from "@/lib/constants/onboarding";

export type StatSection = {
  modality: Modality;
  content: React.ReactNode;
};

const FILTER_LABELS: Record<Modality, string> = {
  gym: "Gym",
  swimming: "Swimming",
  running: "Running",
};

/** Every section is rendered server-side up front (each still streams
 * in via its own Suspense boundary) and just shown/hidden here —
 * switching the filter is instant, same convention as SettingsTabs.
 * The filter row itself only shows once there's more than one
 * modality's worth of sections to actually filter between. */
export function StatisticsFilter({
  availableModalities,
  sections,
}: {
  availableModalities: Modality[];
  sections: StatSection[];
}) {
  const [filter, setFilter] = useState<Modality | "all">("all");

  return (
    <div className="space-y-4">
      {availableModalities.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-3">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3 py-2 text-sm transition ${
              filter === "all"
                ? "bg-indigo-500/15 font-medium text-indigo-300"
                : "text-zinc-400 hover:bg-slate-800 hover:text-zinc-200"
            }`}
          >
            All
          </button>
          {availableModalities.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilter(m)}
              className={`rounded-xl px-3 py-2 text-sm transition ${
                filter === m
                  ? "bg-indigo-500/15 font-medium text-indigo-300"
                  : "text-zinc-400 hover:bg-slate-800 hover:text-zinc-200"
              }`}
            >
              {FILTER_LABELS[m]}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} hidden={filter !== "all" && filter !== section.modality}>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}
