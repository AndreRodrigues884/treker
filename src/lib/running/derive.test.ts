import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatPace,
  latestPrPerDistance,
  matchStandardDistance,
  mostRecentRun,
  pace,
  paceHistory,
  personalBests,
  runningGoalProgress,
  runningTimeHistory,
  runsForDistance,
  runsThisWeek,
  totalDistanceThisWeek,
  weeklyDistanceHistory,
} from "./derive";
import { isoWeekStart } from "@/lib/gym/derive";
import type { Run, RunningPr } from "@/types/running";

function makeRunningPr(overrides: Partial<RunningPr>): RunningPr {
  return {
    id: "id",
    user_id: "user",
    distance_value: "5k",
    distance_km: 5,
    duration_seconds: 1500,
    session_date: "2026-01-01",
    created_at: "",
    ...overrides,
  };
}

function makeRun(overrides: Partial<Run>): Run {
  return {
    id: "id",
    user_id: "user",
    distance_km: 5,
    duration_seconds: 1500, // 25:00 -> 5:00/km
    session_date: "2026-01-01",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("formatDuration", () => {
  it("formats under an hour as M:SS", () => {
    expect(formatDuration(23 * 60 + 45)).toBe("23:45");
  });

  it("formats an hour or over as H:MM:SS", () => {
    expect(formatDuration(3600 + 5 * 60 + 23)).toBe("1:05:23");
  });
});

describe("formatPace", () => {
  it("formats seconds/km as M:SS/km", () => {
    expect(formatPace(5 * 60 + 23)).toBe("5:23/km");
  });

  it("pads seconds under 10", () => {
    expect(formatPace(4 * 60 + 5)).toBe("4:05/km");
  });
});

describe("pace", () => {
  it("is duration divided by distance", () => {
    const run = makeRun({ distance_km: 5, duration_seconds: 1500 });
    expect(pace(run)).toBe(300); // 5:00/km
  });
});

describe("mostRecentRun", () => {
  it("is the run with the latest session_date", () => {
    const runs = [
      makeRun({ id: "a", session_date: "2026-01-01" }),
      makeRun({ id: "b", session_date: "2026-01-15" }),
      makeRun({ id: "c", session_date: "2026-01-08" }),
    ];
    expect(mostRecentRun(runs)?.id).toBe("b");
  });

  it("breaks same-day ties by logged order (created_at)", () => {
    const runs = [
      makeRun({ id: "a", session_date: "2026-01-01", created_at: "2026-01-01T10:00:00Z" }),
      makeRun({ id: "b", session_date: "2026-01-01", created_at: "2026-01-01T09:00:00Z" }),
    ];
    expect(mostRecentRun(runs)?.id).toBe("a");
  });

  it("is null with no runs", () => {
    expect(mostRecentRun([])).toBeNull();
  });
});

describe("paceHistory", () => {
  it("sorts oldest to newest, unclamped (a slow run is a real spike)", () => {
    const runs = [
      makeRun({ session_date: "2026-01-08", distance_km: 5, duration_seconds: 1600 }),
      makeRun({ session_date: "2026-01-01", distance_km: 5, duration_seconds: 1500 }),
      makeRun({ session_date: "2026-01-15", distance_km: 5, duration_seconds: 1700 }),
    ];
    expect(paceHistory(runs)).toEqual([
      { date: "2026-01-01", value: 300 },
      { date: "2026-01-08", value: 320 },
      { date: "2026-01-15", value: 340 },
    ]);
  });
});

describe("weeklyDistanceHistory", () => {
  it("zero-fills the requested number of weeks and sums km per week", () => {
    const thisWeekStart = isoWeekStart(todayISOForTest());
    const runs = [
      makeRun({ session_date: thisWeekStart, distance_km: 5 }),
      makeRun({ session_date: thisWeekStart, distance_km: 3 }),
    ];
    const history = weeklyDistanceHistory(runs, 3);
    expect(history).toHaveLength(3);
    expect(history.at(-1)).toEqual({ weekStart: thisWeekStart, distanceKm: 8 });
    expect(history[0].distanceKm).toBe(0);
  });
});

describe("runsThisWeek / totalDistanceThisWeek", () => {
  it("only counts runs from this week, every run (not distinct days)", () => {
    const monday = isoWeekStart(todayISOForTest());
    const runs = [
      makeRun({ session_date: monday, distance_km: 5 }),
      makeRun({ session_date: monday, distance_km: 3 }),
      makeRun({ session_date: "2020-01-01", distance_km: 10 }),
    ];
    expect(runsThisWeek(runs)).toBe(2);
    expect(totalDistanceThisWeek(runs)).toBe(8);
  });
});

describe("matchStandardDistance", () => {
  it("matches a run within 2% of a standard distance", () => {
    expect(matchStandardDistance(5.05)?.value).toBe("5k");
    expect(matchStandardDistance(21.3)?.value).toBe("half_marathon");
  });

  it("returns null outside tolerance of every standard distance", () => {
    expect(matchStandardDistance(7)).toBeNull();
  });
});

describe("personalBests", () => {
  it("keeps the fastest run per standard distance, not the most recent", () => {
    const runs = [
      makeRun({ id: "a", session_date: "2026-01-01", distance_km: 5, duration_seconds: 1500 }), // 5:00/km
      makeRun({ id: "b", session_date: "2026-01-08", distance_km: 5.02, duration_seconds: 1600 }), // slower, later
      makeRun({ id: "c", session_date: "2026-01-15", distance_km: 10, duration_seconds: 3000 }), // 5:00/km, 10K
      makeRun({ id: "d", session_date: "2026-01-20", distance_km: 7 }), // no standard match
    ];
    const bests = personalBests(runs);
    expect(bests.map((b) => b.distance.value)).toEqual(["5k", "10k"]);
    expect(bests[0].run.id).toBe("a");
    expect(bests[1].run.id).toBe("c");
  });

  it("is empty with no matching runs", () => {
    expect(personalBests([makeRun({ distance_km: 7 })])).toEqual([]);
  });
});

describe("runsForDistance", () => {
  it("keeps only runs within tolerance of the given distance", () => {
    const fiveK = { value: "5k", label: "5K", km: 5 } as const;
    const runs = [
      makeRun({ id: "a", distance_km: 5 }),
      makeRun({ id: "b", distance_km: 5.05 }),
      makeRun({ id: "c", distance_km: 10 }),
    ];
    expect(runsForDistance(runs, fiveK).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("latestPrPerDistance", () => {
  it("keeps only the first (most recent) row per distance", () => {
    // Already sorted most-recent-first, same as getRunningPrs returns.
    const prs = [
      makeRunningPr({ id: "5k-2", distance_value: "5k", session_date: "2026-09-01" }),
      makeRunningPr({ id: "10k-1", distance_value: "10k", session_date: "2026-06-01" }),
      makeRunningPr({ id: "5k-1", distance_value: "5k", session_date: "2026-01-01" }),
    ];
    const latest = latestPrPerDistance(prs);
    expect(latest.map((pr) => pr.id)).toEqual(["5k-2", "10k-1"]);
  });

  it("is empty with no PRs", () => {
    expect(latestPrPerDistance([])).toEqual([]);
  });
});

describe("runningTimeHistory", () => {
  it("normalizes each run's duration to the exact standard distance via pace", () => {
    const fiveK = { value: "5k", label: "5K", km: 5 } as const;
    const runs = [
      // Exactly 5km in 25:00 -> 1500s at the standard distance.
      makeRun({ id: "a", session_date: "2026-01-01", distance_km: 5, duration_seconds: 1500 }),
      // 5.02km (within tolerance) at the same 5:00/km pace -> still
      // normalizes to 1500s for the *standard* 5k, not its raw 1506s.
      makeRun({ id: "b", session_date: "2026-01-08", distance_km: 5.02, duration_seconds: 1506 }),
    ];
    const history = runningTimeHistory(runs, fiveK);
    expect(history).toEqual([
      { date: "2026-01-01", value: 1500 },
      { date: "2026-01-08", value: 1500 },
    ]);
  });

  it("is empty with no runs at that distance", () => {
    const fiveK = { value: "5k", label: "5K", km: 5 } as const;
    expect(runningTimeHistory([makeRun({ distance_km: 10 })], fiveK)).toEqual([]);
  });
});

describe("runningGoalProgress", () => {
  it("is null with no history", () => {
    expect(runningGoalProgress([], 6000)).toBeNull();
  });

  it("computes progress, pace, and an ETA when improving towards the goal", () => {
    const history = [
      { date: "2026-01-01", value: 6600 },
      { date: "2026-01-08", value: 6500 },
    ];
    const result = runningGoalProgress(history, 6000);
    expect(result?.progressPct).toBeCloseTo((100 / 600) * 100);
    expect(result?.paceSecondsPerWeek).toBeCloseTo(-100);
    expect(result?.improving).toBe(true);
    expect(result?.etaDate).not.toBeNull();
  });

  it("caps progress at 100 and has no ETA once the goal is already met", () => {
    const history = [
      { date: "2026-01-01", value: 6200 },
      { date: "2026-01-08", value: 5900 },
    ];
    const result = runningGoalProgress(history, 6000);
    expect(result?.progressPct).toBe(100);
    expect(result?.etaDate).toBeNull();
  });

  it("flags a worsening trend as not improving, with no ETA and progress floored at 0", () => {
    const history = [
      { date: "2026-01-01", value: 6000 },
      { date: "2026-01-08", value: 6100 },
    ];
    const result = runningGoalProgress(history, 5500);
    expect(result?.progressPct).toBe(0);
    expect(result?.improving).toBe(false);
    expect(result?.etaDate).toBeNull();
  });
});

function todayISOForTest() {
  return new Date().toISOString().slice(0, 10);
}
