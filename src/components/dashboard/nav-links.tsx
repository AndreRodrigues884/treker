import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import { LogOutIcon } from "@/components/ui/icons";
import type { ModalityOption } from "@/lib/constants/onboarding";

const linkClass =
  "block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900";

/**
 * Shared between the desktop sidebar (rendered by the server layout) and
 * the mobile drawer (rendered inside a client component) — no hooks here,
 * so it works in either tree. `onNavigate` lets the mobile drawer close
 * itself after a link is clicked.
 */
export function NavLinks({
  tabs,
  onNavigate,
}: {
  tabs: readonly ModalityOption[];
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        <Link href="/dashboard" onClick={onNavigate} className={linkClass}>
          Overview
        </Link>
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/${tab.value}`}
            onClick={onNavigate}
            className={linkClass}
          >
            {tab.label}
          </Link>
        ))}
        <Link href="/dashboard/settings" onClick={onNavigate} className={linkClass}>
          Settings
        </Link>
      </nav>
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-red-400"
        >
          <LogOutIcon className="h-4 w-4" />
          Log out
        </button>
      </form>
    </>
  );
}
