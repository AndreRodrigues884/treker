import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getSwimGoals, getSwimTimes } from "@/lib/swimming/queries";
import { swimEventsWithData } from "@/lib/swimming/derive";
import { SWIM_STROKES } from "@/lib/constants/swimming";
import { LogTimeForm } from "@/components/swimming/log-time-form";
import { SwimEventCard } from "@/components/swimming/swim-event-card";
import { SectionSpinner } from "@/components/ui/section-spinner";

export default async function SwimmingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.modalities.includes("swimming")) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Swimming</h1>
        <p className="text-zinc-400">
          Log a time for any stroke and distance, and watch it over time.
        </p>
      </div>

      {/* Stroke/distance/time are all fixed choices, no data needed, so
       * the log form renders instantly. The events-with-charts section
       * below needs every logged time, deferred into its own Suspense. */}
      <LogTimeForm />

      <Suspense fallback={<SectionSpinner label="Loading your times…" className="h-40" />}>
        <SwimEvents userId={user.id} />
      </Suspense>
    </div>
  );
}

const strokeOrder = SWIM_STROKES.map((s) => s.value);

async function SwimEvents({ userId }: { userId: string }) {
  const [times, goals] = await Promise.all([
    getSwimTimes(userId),
    getSwimGoals(userId),
  ]);
  const events = swimEventsWithData(times).sort((a, b) => {
    const strokeDiff = strokeOrder.indexOf(a.stroke) - strokeOrder.indexOf(b.stroke);
    return strokeDiff !== 0 ? strokeDiff : a.distanceM - b.distanceM;
  });

  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-zinc-500">
        No times logged yet. Log your first one above to start a chart.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <SwimEventCard
          key={`${event.stroke}:${event.distanceM}`}
          event={event}
          times={times}
          goal={
            goals.find(
              (g) => g.stroke === event.stroke && g.distance_m === event.distanceM,
            ) ?? null
          }
        />
      ))}
    </div>
  );
}
