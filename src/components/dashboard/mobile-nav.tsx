"use client";

import { useState } from "react";
import { MenuIcon } from "@/components/ui/icons";
import { SidebarContent } from "@/components/dashboard/sidebar-content";
import type { ModalityOption } from "@/lib/constants/onboarding";

export function MobileNav({
  tabs,
  email,
  goalLabel,
}: {
  tabs: readonly ModalityOption[];
  email: string;
  goalLabel: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-800 bg-slate-950/80 px-4 py-3 md:hidden">
        <span className="flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-xs">
            T
          </span>
          Treker
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-900"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-950 p-4 shadow-2xl">
            <SidebarContent
              tabs={tabs}
              email={email}
              goalLabel={goalLabel}
              onNavigate={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
