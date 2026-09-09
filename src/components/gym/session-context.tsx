"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ExecutionType, SetDifficulty } from "@/lib/constants/gym";

export type PendingSet = {
  weightKg: number | null;
  reps: number;
  executionType: ExecutionType;
  difficulty: SetDifficulty;
};

type PendingMap = Record<string, PendingSet>;

type SessionContextValue = {
  pending: PendingMap;
  setPendingSet: (exerciseId: string, setNumber: number, data: PendingSet) => void;
  getPendingSet: (exerciseId: string, setNumber: number) => PendingSet | undefined;
  clearPending: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function keyFor(exerciseId: string, setNumber: number) {
  return `${exerciseId}:${setNumber}`;
}

/**
 * Sets are staged here (client-only) as the user works through a muscle
 * group's exercises — the "OK" button on each set just writes into this
 * context, no network call. Nothing reaches the database, and nothing
 * counts toward the progress charts, until "Save session" flushes this
 * whole map in one request.
 */
export function WorkoutSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<PendingMap>({});

  const setPendingSet = useCallback(
    (exerciseId: string, setNumber: number, data: PendingSet) => {
      setPending((prev) => ({ ...prev, [keyFor(exerciseId, setNumber)]: data }));
    },
    [],
  );

  const getPendingSet = useCallback(
    (exerciseId: string, setNumber: number) => pending[keyFor(exerciseId, setNumber)],
    [pending],
  );

  const clearPending = useCallback(() => setPending({}), []);

  return (
    <SessionContext.Provider
      value={{ pending, setPendingSet, getPendingSet, clearPending }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useWorkoutSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useWorkoutSession must be used within WorkoutSessionProvider");
  }
  return ctx;
}
