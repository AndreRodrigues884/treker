"use client";

import { useState } from "react";

export type SettingsTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

/** Content for every tab is rendered server-side up front and just
 * shown/hidden here — switching tabs is instant with no extra fetch. */
export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-3">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-indigo-500/15 font-medium text-indigo-300"
                  : "text-zinc-400 hover:bg-slate-800 hover:text-zinc-200"
              }`}
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div key={tab.id} hidden={tab.id !== activeId}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
