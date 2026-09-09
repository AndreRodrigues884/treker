import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { MODALITIES } from "@/lib/constants/onboarding";
import { signOutAction } from "@/lib/auth/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const tabs = MODALITIES.filter((m) => profile.modalities.includes(m.value));

  return (
    <div className="flex min-h-screen bg-slate-950 text-zinc-100">
      <aside className="flex w-56 flex-col border-r border-zinc-800 bg-slate-950/60 p-4">
        <p className="mb-8 px-2 text-lg font-bold tracking-tight">Treker</p>
        <nav className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Overview
          </Link>
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/${tab.value}`}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              {tab.label}
            </Link>
          ))}
          <Link
            href="/dashboard/settings"
            className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Settings
          </Link>
        </nav>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
          >
            Log out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
