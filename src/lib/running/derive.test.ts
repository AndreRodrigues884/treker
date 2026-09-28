import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatPace,
  matchStandardDistance,
  pace,
  paceHistory,
  personalBests,
  runsForDistance,
  runsThisWeek,
  totalDistanceThisWeek,
  weeklyDistanceHistory,
} from "./derive";
import { isoWeekStart } from "@/lib/gym/derive";
import type { Run } from "@/types/running";

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

function todayISOForTest() {
  return new Date().toISOString().slice(0, 10);
}
