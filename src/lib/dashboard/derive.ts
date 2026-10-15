import type { ExerciseSet } from "@/types/gym";
import type { Run } from "@/types/running";
import type { SwimTime } from "@/types/swimming";

const ACTIVE_WINDOW_DAYS = 28;

function cutoffDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - ACTIVE_WINDOW_DAYS);
  return d.toISOString().slice(0, 10);
}

/** Distinct calendar days with at least one logged session across every
 * tracked modality, in the last 4 weeks — the single "how active is
 * this athlete right now" signal the dashboard's title/theme is based
 * on. A day counts once even if gym and a run both happened on it:
 * this measures training frequency, not volume, and a bounded recent
 * window (rather than all-time history) reflects current behavior, not
 * a burst of activity from months ago. */
export function activeDaysRecently(
  gymSets: ExerciseSet[],
  runs: Run[],
  swimTimes: SwimTime[],
): number {
  const cutoff = cutoffDate();
  const days = new Set<string>();
  for (const s of gymSets) if (s.session_date >= cutoff) days.add(s.session_date);
  for (const r of runs) if (r.session_date >= cutoff) days.add(r.session_date);
  for (const t of swimTimes) if (t.session_date >= cutoff) days.add(t.session_date);
  return days.size;
}

export type TrainingTier = "intense" | "regular" | "building" | "starting";

export type TrainingTitle = {
  tier: TrainingTier;
  title: string;
  subtitle: string;
};

/**
 * A title (and, via `tier`, a themed dashboard) from recent training
 * frequency. Deliberately has no "you're inactive" tier — the lowest
 * one is still an invitation, never a verdict, so this stays
 * encouraging no matter how the last month actually went. Thresholds
 * are on a per-week average so they read the same regardless of which
 * modalities (or how many) someone tracks.
 */
export function trainingTitle(activeDays: number): TrainingTitle {
  const perWeek = activeDays / (ACTIVE_WINDOW_DAYS / 7);

  if (perWeek >= 5) {
    return {
      tier: "intense",
      title: "🔥 On Fire",
      subtitle: "Training at an elite pace — this kind of consistency is rare.",
    };
  }
  if (perWeek >= 3) {
    return {
      tier: "regular",
      title: "💪 Consistent Athlete",
      subtitle: "Steady, reliable training — this is exactly how results get built.",
    };
  }
  if (perWeek >= 1) {
    return {
      tier: "building",
      title: "🌱 Building Momentum",
      subtitle: "Every session counts — keep stacking them up.",
    };
  }
  return {
    tier: "starting",
    title: "👋 Ready When You Are",
    subtitle: "Log your first session this week and start your streak.",
  };
}
