"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants/gym";
import { MuscleGroupIcon } from "@/components/gym/muscle-group-icon";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { TrashIcon } from "@/components/ui/icons";

const STORAGE_PREFIX = "treker:pending-session:";

type InProgressSession = {
  muscleGroup: MuscleGroup;
  storageKey: string;
  setCount: number;
  savedAt: number;
};

function readInProgressSessions(userId: string): InProgressSession[] {
  if (typeof window === "undefined") return [];
  const prefix = `${STORAGE_PREFIX}${userId}:`;
  const sessions: InProgressSession[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const storageKey = window.localStorage.key(i);
    if (!storageKey || !storageKey.startsWith(prefix)) continue;
    const scopeKey = storageKey.slice(prefix.length);
    if (!MUSCLE_GROUPS.some((m) => m.value === scopeKey)) continue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { savedAt?: number; pending?: Record<string, unknown> };
      const setCount = Object.keys(parsed.pending ?? {}).length;
      if (setCount === 0) continue;
      sessions.push({
        muscleGroup: scopeKey as MuscleGroup,
        storageKey,
        setCount,
        savedAt: parsed.savedAt ?? Date.now(),
      });
    } catch {
      // Malformed entry — same as session-context.tsx's own parsing,
      // just skip it rather than letting one bad key break the card.
    }
  }
  return sessions.sort((a, b) => b.savedAt - a.savedAt);
}

function formatAgo(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Surfaces a workout that was staged (at least one set confirmed) but
 * never reached "Save session" — the same localStorage backup
 * session-context.tsx already keeps, just made visible from the
 * dashboard instead of sitting silently until the user happens to
 * revisit that exact muscle group page. Nothing here is a server
 * write: "Discard" just clears the local backup (nothing was ever
 * saved to begin with), and "Continue" is a plain navigation — the
 * muscle group page's own restore logic picks the same backup back up.
 */
export function InProgressWorkoutCard({ userId }: { userId: string | undefined }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<InProgressSession[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [discarding, setDiscarding] = useState<InProgressSession | null>(null);

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(readInProgressSessions(userId));

    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!userId || sessions.length === 0) return null;

  function handleDiscardConfirmed() {
    if (!discarding) return;
    window.localStorage.removeItem(discarding.storageKey);
    setSessions((prev) => prev.filter((s) => s.storageKey !== discarding.storageKey));
    setDiscarding(null);
  }

  return (
    <>
      {sessions.map((session) => {
        const entry = MUSCLE_GROUPS.find((m) => m.value === session.muscleGroup);
        return (
          <div
            key={session.storageKey}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${entry?.tint}`}>
                <MuscleGroupIcon group={session.muscleGroup} className="h-6 w-6" />
              </span>
              <div>
                <p className="font-medium text-zinc-100">
                  {entry?.label ?? session.muscleGroup} workout in progress
                </p>
                <p className="text-xs text-zinc-500">
                  {session.setCount} {session.setCount === 1 ? "set" : "sets"} staged ·{" "}
                  {formatAgo(now - session.savedAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscarding(session)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-zinc-400 transition hover:border-red-400 hover:text-red-400"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Discard
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/gym/${session.muscleGroup}`)}
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
              >
                Continue
              </button>
            </div>
          </div>
        );
      })}

      {discarding && (
        <ConfirmModal
          title="Discard this workout?"
          message={`This removes the ${discarding.setCount} staged ${discarding.setCount === 1 ? "set" : "sets"} for ${MUSCLE_GROUPS.find((m) => m.value === discarding.muscleGroup)?.label ?? discarding.muscleGroup}. Nothing was ever saved, so there's nothing in your history to lose — this just clears the draft.`}
          confirmLabel="Discard"
          onConfirm={handleDiscardConfirmed}
          onCancel={() => setDiscarding(null)}
        />
      )}
    </>
  );
}
