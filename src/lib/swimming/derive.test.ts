import { describe, expect, it } from "vitest";
import {
  bestSwimTime,
  formatSwimTime,
  latestSwimTime,
  swimEventsWithData,
  swimGoalProgress,
  swimTimeHistory,
} from "./derive";
import type { SwimTime } from "@/types/swimming";
import type { ProgressPoint } from "@/lib/gym/derive";

function makeTime(overrides: Partial<SwimTime>): SwimTime {
  return {
    id: "id",
    user_id: "user",
    stroke: "freestyle",
    distance_m: 100,
    time_seconds: 80,
    session_date: "2026-01-01",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("swimEventsWithData", () => {
  it("returns each distinct stroke/distance combo once", () => {
    const times = [
      makeTime({ stroke: "freestyle", distance_m: 100 }),
      makeTime({ stroke: "freestyle", distance_m: 100, session_date: "2026-01-08" }),
      makeTime({ stroke: "backstroke", distance_m: 50 }),
    ];
    expect(swimEventsWithData(times)).toEqual([
      { stroke: "freestyle", distanceM: 100 },
      { stroke: "backstroke", distanceM: 50 },
    ]);
  });

  it("is empty with no times", () => {
    expect(swimEventsWithData([])).toEqual([]);
  });
});

describe("swimTimeHistory", () => {
  it("only includes the matching event, sorted oldest to newest, unclamped", () => {
    const event = { stroke: "freestyle" as const, distanceM: 100 };
    const times = [
      makeTime({ session_date: "2026-01-08", time_seconds: 78 }), // faster
      makeTime({ session_date: "2026-01-01", time_seconds: 82 }),
      makeTime({ session_date: "2026-01-15", time_seconds: 85 }), // slower again — not clamped to the PR
      makeTime({ stroke: "backstroke", session_date: "2026-01-01", time_seconds: 90 }),
      makeTime({ distance_m: 50, session_date: "2026-01-01", time_seconds: 30 }),
    ];
    expect(swimTimeHistory(times, event)).toEqual([
      { date: "2026-01-01", value: 82 },
      { date: "2026-01-08", value: 78 },
      { date: "2026-01-15", value: 85 },
    ]);
  });

  it("keeps every attempt on the same day, in logged order", () => {
    // 3x 50m freestyle repeats in one session — a real, normal training
    // pattern, not something that should collapse into one value.
    const event = { stroke: "freestyle" as const, distanceM: 50 };
    const times = [
      makeTime({
        distance_m: 50,
        session_date: "2026-01-01",
        created_at: "2026-01-01T10:02:00Z",
        time_seconds: 32,
      }),
      makeTime({
        distance_m: 50,
        session_date: "2026-01-01",
        created_at: "2026-01-01T10:00:00Z",
        time_seconds: 31,
      }),
      makeTime({
        distance_m: 50,
        session_date: "2026-01-01",
        created_at: "2026-01-01T10:04:00Z",
        time_seconds: 33,
      }),
    ];
    expect(swimTimeHistory(times, event)).toEqual([
      { date: "2026-01-01", value: 31 },
      { date: "2026-01-01", value: 32 },
      { date: "2026-01-01", value: 33 },
    ]);
  });
});

describe("bestSwimTime / latestSwimTime", () => {
  const event = { stroke: "freestyle" as const, distanceM: 100 };

  it("best is the fastest (lowest) time regardless of order", () => {
    const times = [
      makeTime({ session_date: "2026-01-01", time_seconds: 82 }),
      makeTime({ session_date: "2026-01-08", time_seconds: 78 }),
      makeTime({ session_date: "2026-01-15", time_seconds: 85 }),
    ];
    expect(bestSwimTime(times, event)).toBe(78);
    expect(latestSwimTime(times, event)).toBe(85);
  });

  it("are both null with no times for that event", () => {
    expect(bestSwimTime([], event)).toBeNull();
    expect(latestSwimTime([], event)).toBeNull();
  });
});

describe("formatSwimTime", () => {
  it("formats under a minute as bare seconds", () => {
    expect(formatSwimTime(23.4)).toBe("23.40");
  });

  it("formats a minute or over as M:SS.ss, zero-padded", () => {
    expect(formatSwimTime(65.3)).toBe("1:05.30");
    expect(formatSwimTime(83.45)).toBe("1:23.45");
  });

  it("handles a large multi-minute time", () => {
    expect(formatSwimTime(725.07)).toBe("12:05.07");
  });
});

describe("swimGoalProgress", () => {
  it("is null with no history", () => {
    expect(swimGoalProgress([], 90)).toBeNull();
  });

  it("computes progress, pace, and an ETA when improving towards the goal", () => {
    const history: ProgressPoint[] = [
      { date: "2026-01-01", value: 100 },
      { date: "2026-01-08", value: 99 },
    ];
    const result = swimGoalProgress(history, 90);
    expect(result?.progressPct).toBeCloseTo(10);
    expect(result?.paceSecondsPerWeek).toBeCloseTo(-1);
    expect(result?.improving).toBe(true);
    expect(result?.etaDate).toBe("2026-03-12");
  });

  it("caps progress at 100 and has no ETA once the goal is already met", () => {
    const history: ProgressPoint[] = [
      { date: "2026-01-01", value: 95 },
      { date: "2026-01-08", value: 89 },
    ];
    const result = swimGoalProgress(history, 90);
    expect(result?.progressPct).toBe(100);
    expect(result?.etaDate).toBeNull();
  });

  it("flags a worsening trend as not improving, with no ETA and progress floored at 0", () => {
    const history: ProgressPoint[] = [
      { date: "2026-01-01", value: 90 },
      { date: "2026-01-08", value: 92 },
    ];
    const result = swimGoalProgress(history, 85);
    expect(result?.progressPct).toBe(0);
    expect(result?.improving).toBe(false);
    expect(result?.etaDate).toBeNull();
  });

  it("has no pace/ETA with only one data point", () => {
    const history: ProgressPoint[] = [{ date: "2026-01-01", value: 100 }];
    const result = swimGoalProgress(history, 90);
    expect(result?.paceSecondsPerWeek).toBeNull();
    expect(result?.improving).toBe(false);
    expect(result?.etaDate).toBeNull();
  });
});
