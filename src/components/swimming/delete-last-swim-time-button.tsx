"use client";

import { useState, useTransition } from "react";
import { deleteLastSwimTimeAction } from "@/lib/actions/swimming";
import { ConfirmModal } from "@/components/ui/confirm-modal";

/** The only delete capability exposed for swimming: removes exactly the
 * single most recent time, so a logging mistake can be undone without
 * ever touching Supabase directly. Shows the exact entry being removed
 * in the confirmation — the user verifies it's the right one by its
 * own details, not just by trusting "last" means what they think. */
export function DeleteLastSwimTimeButton({
  swimTimeId,
  message,
}: {
  swimTimeId: string;
  message: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteLastSwimTimeAction(swimTimeId);
      setConfirming(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-red-400 transition hover:underline"
      >
        Delete last entry
      </button>
      {confirming && (
        <ConfirmModal
          title="Delete last entry?"
          message={message}
          confirmLabel="Delete"
          pending={pending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
