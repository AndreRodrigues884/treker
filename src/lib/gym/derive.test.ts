import { describe, expect, it } from "vitest";
import {
  averageSessionsPerWeek,
  bestOneRepMaxPerExercise,
  estimatedOneRepMax,
  isoWeekStart,
  lastSessionBefore,
  mostRecentSession,
  lastSessionDate,
  oneRepMaxHistory,
  plateauExercises,
  progressHistory,
  routineProgressHistory,
  routineUnit,
  sessionsThisWeek,
  setsForDate,
  setsPerMuscleGroup,
  setsThisWeek,
  totalStrength,
  totalStrengthHistory,
} from "./derive";
import type { Exercise, ExerciseSet } from "@/types/gym";

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

function makeExercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: "exercise",
    user_id: "user",
    routine_id: "routine",
    position: 0,
    track_1rm: true,
    muscle_group: "chest",
    name: "Bench Press",
    sets: 3,
    reps: 10,
    tracks_load: true,
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

describe("mostRecentSession", () => {
  it("returns null with no sets", () => {
    expect(mostRecentSession([])).toBeNull();
  });

  it("returns the latest session's sets even if it's today's", () => {
    const sets = [
      makeSet({ session_date: "2026-01-01", set_number: 1 }),
      makeSet({ session_date: todayISOForTest(), set_number: 1 }),
    ];
    const result = mostRecentSession(sets);
    expect(result).toHaveLength(1);
    expect(result?.[0].session_date).toBe(todayISOForTest());
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

describe("estimatedOneRepMax", () => {
  it("applies the Epley formula", () => {
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(100 * (1 + 5 / 30));
  });

  it("is zero for zero reps", () => {
    expect(estimatedOneRepMax(100, 0)).toBe(0);
  });
});

describe("bestOneRepMaxPerExercise / totalStrength", () => {
  it("only considers load-tracking exercises, and takes each one's best set", () => {
    const bench = makeExercise({ id: "bench", name: "Bench", tracks_load: true });
    const curl = makeExercise({ id: "curl", name: "Curl", tracks_load: false });
    const sets = [
      makeSet({ exercise_id: "bench", weight_kg: 100, reps: 5 }),
      makeSet({ exercise_id: "bench", weight_kg: 90, reps: 8 }), // worse than the 100x5 set
      makeSet({ exercise_id: "curl", weight_kg: 20, reps: 10 }), // curl doesn't track load
    ];
    const perExercise = bestOneRepMaxPerExercise([bench, curl], sets);
    expect(perExercise).toEqual([
      { exerciseId: "bench", exerciseName: "Bench", oneRepMax: estimatedOneRepMax(100, 5) },
    ]);
    expect(totalStrength(perExercise)).toBeCloseTo(estimatedOneRepMax(100, 5));
  });
});

describe("setsPerMuscleGroup", () => {
  it("counts sets within the window and zero-fills every muscle group", () => {
    const bench = makeExercise({ id: "bench", muscle_group: "chest" });
    const squat = makeExercise({ id: "squat", muscle_group: "legs" });
    const recentDate = todayISOForTest();
    const sets = [
      makeSet({ exercise_id: "bench", session_date: recentDate }),
      makeSet({ exercise_id: "squat", session_date: recentDate, set_number: 2 }),
      makeSet({ exercise_id: "bench", session_date: "2000-01-01" }), // way outside the window
    ];
    const result = setsPerMuscleGroup([bench, squat], sets, 8);
    const chest = result.find((r) => r.muscleGroup === "chest");
    const legs = result.find((r) => r.muscleGroup === "legs");
    const back = result.find((r) => r.muscleGroup === "back");
    expect(chest?.setsCount).toBe(1);
    expect(legs?.setsCount).toBe(1);
    expect(back?.setsCount).toBe(0);
    expect(result).toHaveLength(7);
  });
});

describe("plateauExercises", () => {
  it("flags an exercise whose last sessions never improve", () => {
    const bench = makeExercise({ id: "bench", tracks_load: true });
    const sets = [
      makeSet({ exercise_id: "bench", session_date: "2026-01-01", weight_kg: 100, reps: 5 }),
      makeSet({ exercise_id: "bench", session_date: "2026-01-08", weight_kg: 100, reps: 5 }),
      makeSet({ exercise_id: "bench", session_date: "2026-01-15", weight_kg: 95, reps: 5 }),
    ];
    expect(plateauExercises([bench], sets, 3)).toEqual([
      { exerciseId: "bench", exerciseName: "Bench Press" },
    ]);
  });

  it("does not flag an exercise that's still improving", () => {
    const bench = makeExercise({ id: "bench", tracks_load: true });
    const sets = [
      makeSet({ exercise_id: "bench", session_date: "2026-01-01", weight_kg: 90, reps: 5 }),
      makeSet({ exercise_id: "bench", session_date: "2026-01-08", weight_kg: 95, reps: 5 }),
      makeSet({ exercise_id: "bench", session_date: "2026-01-15", weight_kg: 100, reps: 5 }),
    ];
    expect(plateauExercises([bench], sets, 3)).toEqual([]);
  });

  it("skips exercises without enough sessions to judge", () => {
    const bench = makeExercise({ id: "bench", tracks_load: true });
    const sets = [makeSet({ exercise_id: "bench", session_date: "2026-01-01" })];
    expect(plateauExercises([bench], sets, 3)).toEqual([]);
  });
});

describe("averageSessionsPerWeek", () => {
  it("averages sessions only across weeks that had at least one", () => {
    // Mon 2026-01-05 + Wed 2026-01-07 = 2 sessions in week of Jan 5.
    // Mon 2026-01-12 = 1 session in the next week.
    const sets = [
      makeSet({ session_date: "2026-01-05" }),
      makeSet({ session_date: "2026-01-07" }),
      makeSet({ session_date: "2026-01-12" }),
    ];
    expect(averageSessionsPerWeek(sets)).toBeCloseTo(3 / 2);
  });

  it("is zero with no sets", () => {
    expect(averageSessionsPerWeek([])).toBe(0);
  });
});

describe("lastSessionDate", () => {
  it("returns the most recent session_date across every set", () => {
    const sets = [
      makeSet({ session_date: "2026-01-01" }),
      makeSet({ session_date: "2026-03-15" }),
      makeSet({ session_date: "2026-02-01" }),
    ];
    expect(lastSessionDate(sets)).toBe("2026-03-15");
  });

  it("is null with no sets", () => {
    expect(lastSessionDate([])).toBeNull();
  });
});

describe("setsThisWeek / sessionsThisWeek", () => {
  it("only counts sets on or after this week's Monday", () => {
    const monday = isoWeekStart(todayISOForTest());
    const sets = [
      makeSet({ session_date: monday, set_number: 1 }),
      makeSet({ session_date: monday, set_number: 2 }),
      makeSet({ session_date: "2000-01-01" }), // long before this week
    ];
    expect(setsThisWeek(sets)).toBe(2);
    expect(sessionsThisWeek(sets)).toBe(1); // both sets share the same day
  });

  it("are both zero with no sets this week", () => {
    const sets = [makeSet({ session_date: "2000-01-01" })];
    expect(setsThisWeek(sets)).toBe(0);
    expect(sessionsThisWeek(sets)).toBe(0);
  });
});

describe("routineUnit", () => {
  it("is kg when every exercise tracks load", () => {
    expect(routineUnit([makeExercise({ tracks_load: true })])).toBe("kg");
  });

  it("is reps when none track load", () => {
    expect(routineUnit([makeExercise({ tracks_load: false })])).toBe("reps");
  });

  it("is unitless when mixed", () => {
    expect(
      routineUnit([
        makeExercise({ id: "a", tracks_load: true }),
        makeExercise({ id: "b", tracks_load: false }),
      ]),
    ).toBe("");
  });
});

describe("routineProgressHistory", () => {
  it("combines every exercise in the routine per session, each by its own tracks_load", () => {
    const squat = makeExercise({ id: "squat", tracks_load: true });
    const lunges = makeExercise({ id: "lunges", tracks_load: false });
    const sets = [
      makeSet({ exercise_id: "squat", session_date: "2026-01-01", weight_kg: 100, reps: 5 }),
      makeSet({ exercise_id: "lunges", session_date: "2026-01-01", reps: 12 }),
      makeSet({ exercise_id: "squat", session_date: "2026-01-08", weight_kg: 105, reps: 5 }),
    ];
    expect(routineProgressHistory([squat, lunges], sets)).toEqual([
      { date: "2026-01-01", value: 100 * 5 + 12 },
      { date: "2026-01-08", value: 105 * 5 },
    ]);
  });
});

describe("oneRepMaxHistory", () => {
  it("takes the best set per day, not a running max — a lighter day is a real dip", () => {
    const sets = [
      makeSet({ session_date: "2026-01-01", weight_kg: 100, reps: 5 }),
      makeSet({ session_date: "2026-01-08", weight_kg: 80, reps: 5 }),
    ];
    expect(oneRepMaxHistory(sets)).toEqual([
      { date: "2026-01-01", value: estimatedOneRepMax(100, 5) },
      { date: "2026-01-08", value: estimatedOneRepMax(80, 5) },
    ]);
  });

  it("ignores sets with no weight logged", () => {
    const sets = [makeSet({ session_date: "2026-01-01", weight_kg: null, reps: 5 })];
    expect(oneRepMaxHistory(sets)).toEqual([]);
  });
});

describe("totalStrengthHistory", () => {
  it("sums each exercise's running best 1RM so far, per date", () => {
    const bench = makeExercise({ id: "bench", tracks_load: true });
    const squat = makeExercise({ id: "squat", tracks_load: true });
    const sets = [
      makeSet({ exercise_id: "bench", session_date: "2026-01-01", weight_kg: 100, reps: 5 }),
      makeSet({ exercise_id: "squat", session_date: "2026-01-08", weight_kg: 140, reps: 5 }),
      // A lighter bench day after the PR shouldn't pull the total down.
      makeSet({ exercise_id: "bench", session_date: "2026-01-15", weight_kg: 90, reps: 5 }),
    ];
    const history = totalStrengthHistory([bench, squat], sets);
    expect(history.map((p) => p.date)).toEqual([
      "2026-01-01",
      "2026-01-08",
      "2026-01-15",
    ]);
    expect(history[0].value).toBeCloseTo(estimatedOneRepMax(100, 5));
    expect(history[1].value).toBeCloseTo(
      estimatedOneRepMax(100, 5) + estimatedOneRepMax(140, 5),
    );
    // Still the bench PR (100x5), not the lighter 90x5 day.
    expect(history[2].value).toBeCloseTo(history[1].value);
  });

  it("ignores exercises that don't track load", () => {
    const bodyweight = makeExercise({ id: "bw", tracks_load: false });
    const sets = [makeSet({ exercise_id: "bw", session_date: "2026-01-01", reps: 12 })];
    expect(totalStrengthHistory([bodyweight], sets)).toEqual([]);
  });
});

function todayISOForTest() {
  return new Date().toISOString().slice(0, 10);
}
