import { describe, expect, it } from "vitest";
import { lastSessionBefore, progressHistory, setsForDate } from "./derive";
import type { ExerciseSet } from "@/lib/gym/queries";

function makeSet(overrides: Partial<ExerciseSet>): ExerciseSet {
  return {
    id: "id",
    user_id: "user",
    exercise_id: "exercise",
    session_date: "2026-01-01",
    set_number: 1,
    weight_kg: null,
    reps: 10,
    execution_type: "straight",
    difficulty: "medium",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("setsForDate", () => {
  it("only returns sets on the given date", () => {
    const sets = [
      makeSet({ session_date: "2026-01-01" }),
      makeSet({ session_date: "2026-01-02" }),
    ];
    expect(setsForDate(sets, "2026-01-01")).toHaveLength(1);
  });
});

describe("lastSessionBefore", () => {
  it("returns null when there is no earlier session", () => {
    const sets = [makeSet({ session_date: "2026-01-05" })];
    expect(lastSessionBefore(sets, "2026-01-05")).toBeNull();
  });

  it("returns the most recent session strictly before the given date", () => {
    const sets = [
      makeSet({ session_date: "2026-01-01", set_number: 1 }),
      makeSet({ session_date: "2026-01-03", set_number: 1 }),
      makeSet({ session_date: "2026-01-03", set_number: 2 }),
    ];
    const result = lastSessionBefore(sets, "2026-01-05");
    expect(result).toHaveLength(2);
    expect(result?.every((s) => s.session_date === "2026-01-03")).toBe(true);
  });
});

describe("progressHistory", () => {
  it("sums weight*reps per session when the exercise tracks load", () => {
    const sets = [
      makeSet({ session_date: "2026-01-01", weight_kg: 10, reps: 5 }),
      makeSet({ session_date: "2026-01-01", set_number: 2, weight_kg: 10, reps: 5 }),
      makeSet({ session_date: "2026-01-08", weight_kg: 12, reps: 5 }),
    ];
    expect(progressHistory(sets, true)).toEqual([
      { date: "2026-01-01", value: 100 },
      { date: "2026-01-08", value: 60 },
    ]);
  });

  it("sums reps per session when the exercise doesn't track load", () => {
    const sets = [
      makeSet({ session_date: "2026-01-01", reps: 12, weight_kg: null }),
      makeSet({ session_date: "2026-01-01", set_number: 2, reps: 10, weight_kg: null }),
    ];
    expect(progressHistory(sets, false)).toEqual([
      { date: "2026-01-01", value: 22 },
    ]);
  });

  it("sorts oldest to newest", () => {
    const sets = [
      makeSet({ session_date: "2026-02-01" }),
      makeSet({ session_date: "2026-01-01" }),
    ];
    expect(progressHistory(sets, false).map((p) => p.date)).toEqual([
      "2026-01-01",
      "2026-02-01",
    ]);
  });
});
