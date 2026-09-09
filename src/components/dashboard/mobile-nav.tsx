"use client";

import { useState } from "react";
import Link from "next/link";
import { NavLinks } from "@/components/dashboard/nav-links";
import { MenuIcon, XIcon } from "@/components/ui/icons";
import type { ModalityOption } from "@/lib/constants/onboarding";

export function MobileNav({ tabs }: { tabs: readonly ModalityOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-800 bg-slate-950/80 px-4 py-3 md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base font-bold tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-xs">
            T
          </span>
          Treker
        </Link>
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
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-zinc-800 bg-slate-950 p-4">
            <div className="mb-8 flex items-center justify-between px-2">
              <span className="text-lg font-bold tracking-tight">Treker</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <NavLinks tabs={tabs} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
