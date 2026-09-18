"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ExecutionType, SetDifficulty } from "@/lib/constants/gym";
import { useWorkoutGuard } from "@/components/workout-guard";

export type PendingSet = {
  weightKg: number | null;
  reps: number;
  executionType: ExecutionType;
  difficulty: SetDifficulty;
};

type PendingMap = Record<string, PendingSet>;

type StoredPending = {
  savedAt: number;
  pending: PendingMap;
};

// Mobile browsers routinely reclaim a backgrounded tab's memory when the
// user switches to another heavy app — Instagram, TikTok, exactly what
// people do between gym sets — and silently reload the page when they
// switch back. It looks like the same open tab, but every bit of plain
// React state is gone, which is what was wiping people's in-progress
// sessions. Mirroring `pending` to localStorage (and restoring it on
// mount) survives that; it does not survive an explicit "clear site
// data" or a genuinely new device, which is the right amount of
// durability for a scratch pad that's meant to be flushed by "Save
// session" anyway.
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h: generous for one gym visit, short enough not to resurrect a long-abandoned one.

function storageKeyFor(userId: string, scopeKey: string) {
  return `treker:pending-session:${userId}:${scopeKey}`;
}

function readStoredPending(storageKey: string): PendingMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed: StoredPending = JSON.parse(raw);
    if (!parsed?.pending || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(storageKey);
      return {};
    }
    return parsed.pending;
  } catch {
    return {};
  }
}

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
 * Sets are staged here as the user works through a muscle group's
 * exercises — the "OK" button on each set just writes into this context,
 * no network call. Nothing reaches the database, and nothing counts
 * toward the progress charts, until "Save session" flushes this whole
 * map in one request. Backed by localStorage (see above) so backgrounding
 * the app mid-workout doesn't silently wipe it.
 */
export function WorkoutSessionProvider({
  userId,
  scopeKey,
  validExerciseIds,
  children,
}: {
  /** Whose backup this is — scopes localStorage so it can never leak
   * between accounts on a shared device. */
  userId: string;
  /** What this session is for — the muscle group page it's mounted on —
   * so unrelated pages never restore each other's staged sets. */
  scopeKey: string;
  /** Every exercise id that still exists for this muscle group, as of
   * this page load — a localStorage backup can outlive the exercise it
   * was staged against (deleted from another tab/device, or between
   * visits), and restoring a set for an exercise that's gone is exactly
   * what produced a foreign-key error on "Save session" instead of a
   * clean save of everything still valid. */
  validExerciseIds: string[];
  children: React.ReactNode;
}) {
  const storageKey = storageKeyFor(userId, scopeKey);
  const [pending, setPending] = useState<PendingMap>({});
  const { setDirty } = useWorkoutGuard();

  // Restore whatever survived a backgrounded-tab reload. SSR has no
  // localStorage, so this can only happen client-side, after mount —
  // starting empty and swapping in a moment later, same pattern already
  // used for the theme toggle and the dashboard greeting.
  useEffect(() => {
    const restored = readStoredPending(storageKey);
    const validIds = new Set(validExerciseIds);
    const stillValid = Object.fromEntries(
      Object.entries(restored).filter(([key]) => validIds.has(key.split(":")[0])),
    );
    if (Object.keys(stillValid).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPending(stillValid);
    }
    // Only meant to run once, against the exercise list as it was on
    // this load — re-running it if validExerciseIds changes later (e.g.
    // adding a new exercise mid-visit) would re-trigger a restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Mirror every change to localStorage. Clears itself once nothing's
  // staged — including right after a successful "Save session" — so
  // there's nothing extra to clean up there.
  useEffect(() => {
    try {
      if (Object.keys(pending).length > 0) {
        const payload: StoredPending = { savedAt: Date.now(), pending };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Storage can be unavailable (private browsing, quota) — staging
      // still works in-memory for the current tab either way.
    }
  }, [pending, storageKey]);

  // Report "has unsaved sets" up to the shell-level guard whenever the
  // staged count changes — this is a genuine cross-tree sync (the guard
  // lives above the sidebar, outside this provider's own subtree), not
  // derived local state, so an effect is the right tool here. Cleanup
  // clears it on unmount too, e.g. after a guarded navigation actually
  // goes through.
  const pendingCount = Object.keys(pending).length;
  useEffect(() => {
    setDirty(pendingCount > 0);
    return () => setDirty(false);
  }, [pendingCount, setDirty]);

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

  // Without this, the context value was a fresh object every render —
  // every ExerciseCard on the page would re-render whenever
  // WorkoutSessionProvider re-rendered for any reason, not just when
  // `pending` itself actually changed.
  const value = useMemo(
    () => ({ pending, setPendingSet, getPendingSet, clearPending }),
    [pending, setPendingSet, getPendingSet, clearPending],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useWorkoutSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useWorkoutSession must be used within WorkoutSessionProvider");
  }
  return ctx;
}
