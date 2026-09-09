import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { MODALITIES, TRAINING_GOALS } from "@/lib/constants/onboarding";
import { SidebarContent } from "@/components/dashboard/sidebar-content";
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
  const goalLabel = profile.goals.length
    ? TRAINING_GOALS.find((g) => g.value === profile.goals[0])?.label ?? null
    : null;
  const email = user.email ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-zinc-100 md:flex-row">
      <MobileNav tabs={tabs} email={email} goalLabel={goalLabel} />

      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-slate-950/60 p-4 md:flex">
        <SidebarContent tabs={tabs} email={email} goalLabel={goalLabel} />
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
