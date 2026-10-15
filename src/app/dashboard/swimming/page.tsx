import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getSwimGoals, getSwimTimes } from "@/lib/swimming/queries";
import { formatSwimTime, swimEventsWithData, swimPacePer100m } from "@/lib/swimming/derive";
import { SWIM_STROKES } from "@/lib/constants/swimming";
import { LogTimeForm } from "@/components/swimming/log-time-form";
import { SwimEventCard } from "@/components/swimming/swim-event-card";
import { DeleteLastSwimTimeButton } from "@/components/swimming/delete-last-swim-time-button";
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

  const recent = [...times].reverse().slice(0, 10);
  const mostRecent = recent[0];

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-zinc-100">Recent Times</h2>
          {mostRecent && (
            <DeleteLastSwimTimeButton
              swimTimeId={mostRecent.id}
              message={`This removes your most recent time: ${mostRecent.distance_m}m ${mostRecent.stroke} in ${formatSwimTime(Number(mostRecent.time_seconds))} on ${mostRecent.session_date}. This can't be undone.`}
            />
          )}
        </div>
        <ul className="space-y-2">
          {recent.map((t) => {
            const strokeEntry = SWIM_STROKES.find((s) => s.value === t.stroke);
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-zinc-100">
                    <span aria-hidden>{strokeEntry?.icon}</span> {t.distance_m}m{" "}
                    {strokeEntry?.label ?? t.stroke}
                  </p>
                  <p className="text-xs text-zinc-500">{t.session_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-cyan-300">{formatSwimTime(Number(t.time_seconds))}</p>
                  <p className="text-xs text-zinc-500">
                    {formatSwimTime(swimPacePer100m(Number(t.time_seconds), t.distance_m))}/100m
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

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
