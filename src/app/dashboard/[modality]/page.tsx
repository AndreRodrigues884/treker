import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { MODALITIES, type Modality } from "@/lib/constants/onboarding";

export function generateStaticParams() {
  return MODALITIES.map((m) => ({ modality: m.value }));
}

export default async function ModalityPage({
  params,
}: {
  params: Promise<{ modality: string }>;
}) {
  const { modality } = await params;
  const entry = MODALITIES.find((m) => m.value === modality);
  if (!entry) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.modalities.includes(modality as Modality)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{entry.label}</h1>
      <p className="text-zinc-400">
        Training plan for {entry.label} — coming soon.
      </p>
    </div>
  );
}
