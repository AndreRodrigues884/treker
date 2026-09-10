"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LeaveModal } from "@/components/dashboard/leave-modal";

type WorkoutGuardValue = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** Use instead of <Link>/router.push for any in-app navigation that
   * should be held back while there's an unsaved workout session. */
  navigate: (href: string) => void;
};

const WorkoutGuardContext = createContext<WorkoutGuardValue | null>(null);

/**
 * Tracks whether there's an unsaved workout session in progress (sets
 * staged in a gym WorkoutSessionProvider but not yet flushed by "Save
 * session") and, when there is, intercepts in-app navigation with a
 * confirm dialog instead of silently discarding the staged sets.
 *
 * Mounted once around the whole dashboard shell (sidebar + page content)
 * so both the sidebar links and in-page nav (muscle group tabs) share the
 * same guard — adapted from a reference WorkoutGuard/Sidebar pair the user
 * supplied from an earlier project.
 */
export function WorkoutGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (isDirty && href !== pathname) {
        setPendingHref(href);
        return;
      }
      router.push(href);
    },
    [isDirty, pathname, router],
  );

  function confirmLeave() {
    if (!pendingHref) return;
    setDirty(false);
    router.push(pendingHref);
    setPendingHref(null);
  }

  return (
    <WorkoutGuardContext.Provider value={{ isDirty, setDirty, navigate }}>
      {children}
      {pendingHref && (
        <LeaveModal
          onConfirm={confirmLeave}
          onCancel={() => setPendingHref(null)}
        />
      )}
    </WorkoutGuardContext.Provider>
  );
}

/** Safe to call from anywhere, even outside the provider — falls back to a
 * plain router.push with isDirty always false, so callers don't need to
 * special-case pages where no guard is mounted. */
export function useWorkoutGuard(): WorkoutGuardValue {
  const ctx = useContext(WorkoutGuardContext);
  const router = useRouter();
  if (ctx) return ctx;
  return { isDirty: false, setDirty: () => {}, navigate: (href) => router.push(href) };
}
