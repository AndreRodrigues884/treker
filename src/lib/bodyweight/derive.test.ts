import { describe, expect, it } from "vitest";
import {
  bodyweightChangeSinceStart,
  bodyweightHistory,
  latestBodyweight,
  loggedToday,
} from "./derive";
import type { BodyweightLog } from "@/types/bodyweight";

function makeLog(overrides: Partial<BodyweightLog>): BodyweightLog {
  return {
    id: "id",
    user_id: "user",
    weight_kg: 80,
    logged_at: "2026-01-01",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("bodyweightHistory", () => {
  it("maps each log to a date/value point", () => {
    const logs = [
      makeLog({ logged_at: "2026-01-01", weight_kg: 82 }),
      makeLog({ logged_at: "2026-01-08", weight_kg: 81.5 }),
    ];
    expect(bodyweightHistory(logs)).toEqual([
      { date: "2026-01-01", value: 82 },
      { date: "2026-01-08", value: 81.5 },
    ]);
  });

  it("is empty with no logs", () => {
    expect(bodyweightHistory([])).toEqual([]);
  });
});

describe("latestBodyweight", () => {
  it("is the last log's weight, regardless of trend direction", () => {
    const logs = [
      makeLog({ logged_at: "2026-01-01", weight_kg: 82 }),
      makeLog({ logged_at: "2026-01-08", weight_kg: 81.5 }),
    ];
    expect(latestBodyweight(logs)).toBe(81.5);
  });

  it("is null with no logs", () => {
    expect(latestBodyweight([])).toBeNull();
  });
});

describe("bodyweightChangeSinceStart", () => {
  it("is latest minus first", () => {
    const logs = [
      makeLog({ logged_at: "2026-01-01", weight_kg: 82 }),
      makeLog({ logged_at: "2026-01-08", weight_kg: 79 }),
      makeLog({ logged_at: "2026-01-15", weight_kg: 80 }),
    ];
    expect(bodyweightChangeSinceStart(logs)).toBeCloseTo(-2);
  });

  it("is null with fewer than two logs", () => {
    expect(bodyweightChangeSinceStart([])).toBeNull();
    expect(bodyweightChangeSinceStart([makeLog({})])).toBeNull();
  });
});

describe("loggedToday", () => {
  it("is true only when today's date has an entry", () => {
    const logs = [makeLog({ logged_at: "2026-01-08" })];
    expect(loggedToday(logs, "2026-01-08")).toBe(true);
    expect(loggedToday(logs, "2026-01-09")).toBe(false);
  });
});
