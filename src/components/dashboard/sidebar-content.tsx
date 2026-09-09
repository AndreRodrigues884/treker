"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { XIcon } from "@/components/ui/icons";
import type { ModalityOption } from "@/lib/constants/onboarding";

/**
 * The whole sidebar — brand header, nav (icon badge + active highlight),
 * and a footer with the current goal, email and log out. Shared as-is
 * between the desktop aside and the mobile drawer, so they never drift
 * apart; `usePathname()` means this has to be a Client Component, which
 * is fine to render directly from the server layout.
 */
export function SidebarContent({
  tabs,
  email,
  goalLabel,
  onNavigate,
  onClose,
}: {
  tabs: readonly ModalityOption[];
  email: string;
  goalLabel: string | null;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const items = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: "📊",
      tint: "bg-indigo-500/15",
    },
    ...tabs.map((t) => ({
      href: `/dashboard/${t.value}`,
      label: t.label,
      icon: t.icon,
      tint: t.tint,
    })),
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: "⚙️",
      tint: "bg-zinc-500/15",
    },
  ];

  const subtitle = tabs.map((t) => t.label).join(" · ") || "Let's train";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-lg font-bold">
            T
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight">Treker</p>
            <p className="truncate text-xs text-zinc-500">{subtitle}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-indigo-500/15 font-medium text-indigo-300"
                  : "text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${item.tint}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-zinc-800 pt-4">
        {goalLabel && (
          <p className="truncate px-1 text-xs text-zinc-500">🎯 {goalLabel}</p>
        )}
        <p className="truncate px-1 text-xs text-zinc-500">{email}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-base">
              🚪
            </span>
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
