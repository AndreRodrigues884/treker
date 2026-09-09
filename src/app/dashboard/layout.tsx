import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { MODALITIES } from "@/lib/constants/onboarding";
import { NavLinks } from "@/components/dashboard/nav-links";
import { MobileNav } from "@/components/dashboard/mobile-nav";

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
    <div className="flex min-h-screen flex-col bg-slate-950 text-zinc-100 md:flex-row">
      <MobileNav tabs={tabs} />

      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-800 bg-slate-950/60 p-4 md:flex">
        <p className="mb-8 px-2 text-lg font-bold tracking-tight">Treker</p>
        <NavLinks tabs={tabs} />
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
