"use client";

import { useState } from "react";
import Image from "next/image";
import { MenuIcon } from "@/components/ui/icons";
import { SidebarContent } from "@/components/dashboard/sidebar-content";
import type { ModalityOption } from "@/lib/constants/onboarding";

export function MobileNav({ tabs }: { tabs: readonly ModalityOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-700 bg-slate-900/80 px-4 py-3 backdrop-blur md:hidden">
        <span className="flex items-center gap-2 text-base font-bold tracking-tight">
          <Image
            src="/logo/treker-logo.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg"
          />
          Treker
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-zinc-300 hover:bg-slate-800"
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
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900 p-4 shadow-2xl">
            <SidebarContent
              tabs={tabs}
              onNavigate={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
