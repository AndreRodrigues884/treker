import type { BodyweightLog } from "@/types/bodyweight";
import type { ProgressPoint } from "@/lib/gym/derive";

/** One point per logged day, oldest to newest — queries.ts already
 * orders by logged_at, this just reshapes for ProgressChart. */
export function bodyweightHistory(logs: BodyweightLog[]): ProgressPoint[] {
  return logs.map((log) => ({ date: log.logged_at, value: Number(log.weight_kg) }));
}

export function latestBodyweight(logs: BodyweightLog[]): number | null {
  return logs.length ? Number(logs.at(-1)!.weight_kg) : null;
}

/** Latest reading minus the very first ever logged — negative means
 * lighter than when tracking started. Null until there are at least two
 * readings to compare. */
export function bodyweightChangeSinceStart(logs: BodyweightLog[]): number | null {
  if (logs.length < 2) return null;
  return Number(logs.at(-1)!.weight_kg) - Number(logs[0].weight_kg);
}

/** Whether today's date already has a logged entry — decides whether
 * the dashboard card shows "log today's weight" or "edit today's
 * weight". */
export function loggedToday(logs: BodyweightLog[], today: string): boolean {
  return logs.some((log) => log.logged_at === today);
}
