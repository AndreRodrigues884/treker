/**
 * Fixed, pre-defined lists for the Swimming module. Values must match the
 * Postgres enum in supabase/migrations (`swim_stroke`) — a closed list,
 * not free text, same reasoning as the Gym module's muscle groups.
 *
 * Unlike Gym, distances aren't a DB enum — they're a plain integer
 * (meters), with this list only enforced at the form/validation layer.
 * That's simpler for something that's fundamentally a magnitude, and
 * still closed enough that charts/aggregations stay consistent.
 */

export const SWIM_STROKES = [
  { value: "freestyle", label: "Freestyle", icon: "🏊" },
  { value: "backstroke", label: "Backstroke", icon: "🔄" },
  { value: "breaststroke", label: "Breaststroke", icon: "🐸" },
  { value: "butterfly", label: "Butterfly", icon: "🦋" },
] as const;

export const SWIM_DISTANCES = [25, 50, 100, 200, 400, 800, 1000] as const;

export type SwimStroke = (typeof SWIM_STROKES)[number]["value"];
export type SwimDistance = (typeof SWIM_DISTANCES)[number];
