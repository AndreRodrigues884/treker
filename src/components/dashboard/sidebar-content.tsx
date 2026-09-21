"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOutAction } from "@/lib/auth/actions";
import { XIcon } from "@/components/ui/icons";
import type { ModalityOption } from "@/lib/constants/onboarding";
import { useWorkoutGuard } from "@/components/workout-guard";

/**
 * The whole sidebar — brand header, nav (icon badge + active highlight),
 * and a footer with an Achievements link and log out. Shared as-is
 * between the desktop aside and the mobile drawer, so they never drift
 * apart; `usePathname()` means this has to be a Client Component, which
 * is fine to render directly from the server layout.
 */
export function SidebarContent({
  tabs,
  onNavigate,
  onClose,
}: {
  tabs: readonly ModalityOption[];
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { navigate } = useWorkoutGuard();

  function handleNav(href: string) {
    navigate(href);
    onNavigate?.();
  }

  const items = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: "📊",
      tint: "bg-linear-to-br from-indigo-500/30 to-indigo-500/5",
    },
    ...tabs.map((t) => ({
      href: `/dashboard/${t.value}`,
      label: t.label,
      icon: t.icon,
      tint: t.tint,
    })),
    // Gym-only for now — the stats themselves (1RM, muscle group volume,
    // deload) only make sense once there's a Gym module to draw from.
    ...(tabs.some((t) => t.value === "gym")
      ? [
          {
            href: "/dashboard/statistics",
            label: "Statistics",
            icon: "📈",
            tint: "bg-linear-to-br from-violet-500/30 to-violet-500/5",
          },
        ]
      : []),
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: "⚙️",
      tint: "bg-linear-to-br from-slate-500/25 to-slate-500/5",
    },
  ];

  const subtitle = tabs.map((t) => t.label).join(" · ") || "Let's train";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo/treker-logo.svg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl"
          />
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
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-slate-800"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          // "/dashboard" itself only highlights on an exact match, or it'd
          // stay lit up on every other tab too (they all start with it);
          // every other tab highlights for its whole sub-tree, so e.g.
          // /dashboard/gym/legs still keeps "Gym" active.
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => handleNav(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-indigo-500/15 font-medium text-indigo-300"
                  : "text-zinc-300 hover:bg-slate-800"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${item.tint}`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-700 pt-4">
        <button
          type="button"
          onClick={() => handleNav("/dashboard/achievements")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
            pathname.startsWith("/dashboard/achievements")
              ? "bg-amber-500/15 font-medium text-amber-300"
              : "text-zinc-300 hover:bg-slate-800"
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-500/30 to-amber-500/5 text-base">
            🏆
          </span>
          Achievements
        </button>
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
