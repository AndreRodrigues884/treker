import { describe, expect, it } from "vitest";
import { activeDaysRecently, trainingTitle } from "./derive";
import type { ExerciseSet } from "@/types/gym";
import type { Run } from "@/types/running";
import type { SwimTime } from "@/types/swimming";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function makeSet(sessionDate: string): ExerciseSet {
  return {
    id: "id",
    user_id: "user",
    exercise_id: "exercise",
    session_date: sessionDate,
    set_number: 1,
    weight_kg: null,
    reps: 10,
    execution_type: "straight",
    difficulty: "medium",
    created_at: "",
    updated_at: "",
  };
}

function makeRun(sessionDate: string): Run {
  return {
    id: "id",
    user_id: "user",
    distance_km: 5,
    duration_seconds: 1500,
    session_date: sessionDate,
    created_at: "",
    updated_at: "",
  };
}

function makeSwimTime(sessionDate: string): SwimTime {
  return {
    id: "id",
    user_id: "user",
    stroke: "freestyle",
    distance_m: 100,
    time_seconds: 80,
    session_date: sessionDate,
    created_at: "",
    updated_at: "",
  };
}

describe("activeDaysRecently", () => {
  it("counts a day once even when gym and a run both happened on it", () => {
    const today = isoDaysAgo(0);
    const gymSets = [makeSet(today)];
    const runs = [makeRun(today)];
    expect(activeDaysRecently(gymSets, runs, [])).toBe(1);
  });

  it("counts distinct days across every modality", () => {
    const gymSets = [makeSet(isoDaysAgo(1)), makeSet(isoDaysAgo(2))];
    const runs = [makeRun(isoDaysAgo(3))];
    const swimTimes = [makeSwimTime(isoDaysAgo(4))];
    expect(activeDaysRecently(gymSets, runs, swimTimes)).toBe(4);
  });

  it("ignores anything older than the 4-week window", () => {
    const gymSets = [makeSet(isoDaysAgo(29))];
    expect(activeDaysRecently(gymSets, [], [])).toBe(0);
  });

  it("is 0 with no data in any modality", () => {
    expect(activeDaysRecently([], [], [])).toBe(0);
  });
});

describe("trainingTitle", () => {
  it("is 'intense' at 5+ active days/week (20+ in the 4-week window)", () => {
    expect(trainingTitle(20).tier).toBe("intense");
  });

  it("is 'regular' at 3-4 active days/week", () => {
    expect(trainingTitle(12).tier).toBe("regular");
  });

  it("is 'building' at 1-2 active days/week", () => {
    expect(trainingTitle(4).tier).toBe("building");
  });

  it("is 'starting' with no recent activity, never a demotivating tier", () => {
    const result = trainingTitle(0);
    expect(result.tier).toBe("starting");
    // The whole point of this tier: still an invitation, not a verdict.
    expect(result.title.toLowerCase()).not.toMatch(/inactive|lazy|behind|slack/);
  });
});
