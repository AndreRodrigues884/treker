import { describe, expect, it } from "vitest";
import {
  averageSessionsPerWeek,
  bestOneRepMaxPerExercise,
  deloadExercises,
  deloadSuggestion,
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
  sessionsPerWeekHistory,
  sessionsThisWeek,
  setsForDate,
  setsPerMuscleGroup,
  setsThisWeek,
  latestPrPerExercise,
  totalStrength,
  totalStrengthHistory,
  totalVolumeEver,
} from "./derive";
import type { DeloadAcknowledgement, Exercise, ExercisePr, ExerciseSet } from "@/types/gym";

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
    unit: "reps",
    tracks_load: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makePr(overrides: Partial<ExercisePr>): ExercisePr {
  return {
    id: "pr",
    user_id: "user",
    exercise_id: "exercise",
    session_date: "2026-01-01",
    weight_kg: 100,
    reps: 5,
    one_rep_max: 116.67,
    created_at: "",
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

  it("excludes timed (seconds) exercises even if they track load", () => {
    const plank = makeExercise({
      id: "plank",
      name: "Weighted Plank",
      tracks_load: true,
      unit: "seconds",
    });
    const sets = [makeSet({ exercise_id: "plank", weight_kg: 20, reps: 60 })];
    expect(bestOneRepMaxPerExercise([plank], sets)).toEqual([]);
  });
});

describe("totalVolumeEver", () => {
  it("sums weight × reps across load-tracking exercises only", () => {
    const bench = makeExercise({ id: "bench", tracks_load: true });
    const curl = makeExercise({ id: "curl", tracks_load: false });
    const sets = [
      makeSet({ exercise_id: "bench", weight_kg: 100, reps: 5 }), // 500
      makeSet({ exercise_id: "bench", weight_kg: 80, reps: 10 }), // 800
      makeSet({ exercise_id: "curl", weight_kg: 20, reps: 10 }), // excluded
    ];
    expect(totalVolumeEver([bench, curl], sets)).toBe(1300);
  });

  it("excludes timed (seconds) exercises even if they track load", () => {
    const plank = makeExercise({
      id: "plank",
      tracks_load: true,
      unit: "seconds",
    });
    const sets = [makeSet({ exercise_id: "plank", weight_kg: 20, reps: 60 })];
    expect(totalVolumeEver([plank], sets)).toBe(0);
  });

  it("is zero with no load-tracking sets", () => {
    expect(totalVolumeEver([], [])).toBe(0);
  });
});

describe("latestPrPerExercise", () => {
  it("keeps only the first (most recent) row per exercise", () => {
    // Already sorted most-recent-first, same as getExercisePrs returns —
    // bench's Sept PR should win over its January one.
    const prs = [
      makePr({ id: "bench-2", exercise_id: "bench", session_date: "2026-09-01", one_rep_max: 150 }),
      makePr({ id: "squat-1", exercise_id: "squat", session_date: "2026-06-01", one_rep_max: 200 }),
      makePr({ id: "bench-1", exercise_id: "bench", session_date: "2026-01-01", one_rep_max: 120 }),
    ];
    const latest = latestPrPerExercise(prs);
    expect(latest.map((pr) => pr.id)).toEqual(["bench-2", "squat-1"]);
  });

  it("is empty with no PRs", () => {
    expect(latestPrPerExercise([])).toEqual([]);
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

describe("deloadSuggestion", () => {
  it("suggests ~10% lighter (nearest 0.5kg), one fewer set, same reps", () => {
    const bench = makeExercise({ id: "bench", sets: 4, reps: 8, tracks_load: true });
    const sets = [
      makeSet({ exercise_id: "bench", session_date: "2026-01-15", weight_kg: 101, reps: 8 }),
    ];
    expect(deloadSuggestion(bench, sets)).toEqual({ sets: 3, reps: 8, weightKg: 91 });
  });

  it("never suggests fewer than 2 sets", () => {
    const bench = makeExercise({ id: "bench", sets: 2, reps: 8, tracks_load: true });
    expect(deloadSuggestion(bench, []).sets).toBe(2);
  });

  it("has no weight suggestion for exercises that don't track load", () => {
    const plank = makeExercise({ id: "plank", sets: 3, reps: 30, tracks_load: false });
    const sets = [makeSet({ exercise_id: "plank", session_date: "2026-01-15", reps: 30 })];
    expect(deloadSuggestion(plank, sets)).toEqual({ sets: 2, reps: 30, weightKg: null });
  });
});

describe("deloadExercises", () => {
  function makeAck(overrides: Partial<DeloadAcknowledgement>): DeloadAcknowledgement {
    return {
      id: "ack",
      user_id: "user",
      exercise_id: "bench",
      acknowledged_at: "2026-01-16T00:00:00Z",
      ...overrides,
    };
  }

  const flatSets = [
    makeSet({ exercise_id: "bench", session_date: "2026-01-01", weight_kg: 100, reps: 5 }),
    makeSet({ exercise_id: "bench", session_date: "2026-01-08", weight_kg: 100, reps: 5 }),
    makeSet({ exercise_id: "bench", session_date: "2026-01-15", weight_kg: 95, reps: 5 }),
  ];

  it("includes a suggestion alongside each plateaued exercise", () => {
    const bench = makeExercise({ id: "bench" });
    const result = deloadExercises([bench], flatSets, [], 3);
    expect(result).toEqual([
      {
        exerciseId: "bench",
        exerciseName: "Bench Press",
        suggestion: deloadSuggestion(bench, flatSets),
      },
    ]);
  });

  it("hides an exercise acknowledged after its last logged set", () => {
    const bench = makeExercise({ id: "bench" });
    const acks = [makeAck({ acknowledged_at: "2026-01-16T00:00:00Z" })]; // after 01-15
    expect(deloadExercises([bench], flatSets, acks, 3)).toEqual([]);
  });

  it("shows the exercise again once a new set lands after the acknowledgement", () => {
    const bench = makeExercise({ id: "bench" });
    const acks = [makeAck({ acknowledged_at: "2026-01-16T00:00:00Z" })];
    const setsWithNewOne = [
      ...flatSets,
      makeSet({ exercise_id: "bench", session_date: "2026-01-22", weight_kg: 95, reps: 5 }),
    ];
    const result = deloadExercises([bench], setsWithNewOne, acks, 3);
    expect(result.map((r) => r.exerciseId)).toEqual(["bench"]);
  });
});

describe("averageSessionsPerWeek", () => {
  const exercises = [makeExercise({ id: "exercise" })];

  it("averages sessions only across weeks that had at least one", () => {
    // Mon 2026-01-05 + Wed 2026-01-07 = 2 sessions in week of Jan 5.
    // Mon 2026-01-12 = 1 session in the next week.
    const sets = [
      makeSet({ session_date: "2026-01-05" }),
      makeSet({ session_date: "2026-01-07" }),
      makeSet({ session_date: "2026-01-12" }),
    ];
    expect(averageSessionsPerWeek(sets, exercises)).toBeCloseTo(3 / 2);
  });

  it("is zero with no sets", () => {
    expect(averageSessionsPerWeek([], exercises)).toBe(0);
  });

  it("counts two muscle groups trained the same day as two sessions", () => {
    const back = makeExercise({ id: "back-ex", muscle_group: "back" });
    const chest = makeExercise({ id: "chest-ex", muscle_group: "chest" });
    const sets = [
      makeSet({ exercise_id: "back-ex", session_date: "2026-01-05" }),
      makeSet({ exercise_id: "chest-ex", session_date: "2026-01-05" }),
    ];
    expect(averageSessionsPerWeek(sets, [back, chest])).toBe(2);
  });
});

describe("sessionsPerWeekHistory", () => {
  const exercises = [makeExercise({ id: "exercise" })];

  it("always returns exactly `weeks` entries, oldest to newest, zero-filled", () => {
    const currentWeekStart = isoWeekStart(todayISOForTest());
    const oneWeekAgo = isoWeekStart(
      new Date(new Date(`${currentWeekStart}T00:00:00Z`).getTime() - 7 * 86_400_000)
        .toISOString()
        .slice(0, 10),
    );
    const sets = [
      makeSet({ session_date: currentWeekStart }),
      makeSet({ session_date: oneWeekAgo, set_number: 1 }),
      makeSet({ session_date: oneWeekAgo, set_number: 2 }),
    ];
    const history = sessionsPerWeekHistory(sets, exercises, 5);
    expect(history).toHaveLength(5);
    expect(history[4]).toEqual({ weekStart: currentWeekStart, sessions: 1 });
    expect(history[3]).toEqual({ weekStart: oneWeekAgo, sessions: 1 });
    // Weeks with nothing logged are still present, at zero.
    expect(history[0].sessions).toBe(0);
    expect(history[1].sessions).toBe(0);
  });

  it("is all zeros with no sets", () => {
    const history = sessionsPerWeekHistory([], exercises, 5);
    expect(history).toHaveLength(5);
    expect(history.every((w) => w.sessions === 0)).toBe(true);
  });

  it("counts two muscle groups trained the same day as two sessions", () => {
    const today = todayISOForTest();
    const back = makeExercise({ id: "back-ex", muscle_group: "back" });
    const chest = makeExercise({ id: "chest-ex", muscle_group: "chest" });
    const sets = [
      makeSet({ exercise_id: "back-ex", session_date: today }),
      makeSet({ exercise_id: "chest-ex", session_date: today }),
    ];
    const history = sessionsPerWeekHistory(sets, [back, chest], 5);
    expect(history.at(-1)?.sessions).toBe(2);
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
  const exercises = [makeExercise({ id: "exercise" })];

  it("only counts sets on or after this week's Monday", () => {
    const monday = isoWeekStart(todayISOForTest());
    const sets = [
      makeSet({ session_date: monday, set_number: 1 }),
      makeSet({ session_date: monday, set_number: 2 }),
      makeSet({ session_date: "2000-01-01" }), // long before this week
    ];
    expect(setsThisWeek(sets)).toBe(2);
    // Both sets share the same day AND muscle group, so one workout.
    expect(sessionsThisWeek(sets, exercises)).toBe(1);
  });

  it("are both zero with no sets this week", () => {
    const sets = [makeSet({ session_date: "2000-01-01" })];
    expect(setsThisWeek(sets)).toBe(0);
    expect(sessionsThisWeek(sets, exercises)).toBe(0);
  });

  it("counts back+chest same day, plus shoulders the day before, as three workouts", () => {
    const monday = isoWeekStart(todayISOForTest());
    const tuesday = new Date(`${monday}T00:00:00Z`);
    tuesday.setUTCDate(tuesday.getUTCDate() + 1);
    const tuesdayISO = tuesday.toISOString().slice(0, 10);

    const back = makeExercise({ id: "back-ex", muscle_group: "back" });
    const chest = makeExercise({ id: "chest-ex", muscle_group: "chest" });
    const shoulders = makeExercise({ id: "shoulders-ex", muscle_group: "shoulders" });
    const sets = [
      // Monday: shoulders.
      makeSet({ exercise_id: "shoulders-ex", session_date: monday }),
      // Tuesday: back AND chest — two separate workouts, same day.
      makeSet({ exercise_id: "back-ex", session_date: tuesdayISO }),
      makeSet({ exercise_id: "chest-ex", session_date: tuesdayISO }),
    ];
    expect(sessionsThisWeek(sets, [back, chest, shoulders])).toBe(3);
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

  it("is secs when no exercise tracks load and all are timed", () => {
    expect(
      routineUnit([makeExercise({ tracks_load: false, unit: "seconds" })]),
    ).toBe("secs");
  });

  it("is unitless when non-load exercises mix reps and seconds", () => {
    expect(
      routineUnit([
        makeExercise({ id: "a", tracks_load: false, unit: "reps" }),
        makeExercise({ id: "b", tracks_load: false, unit: "seconds" }),
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
