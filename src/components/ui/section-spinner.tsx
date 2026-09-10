import { SpinnerIcon } from "@/components/ui/icons";

/** The fallback shown inside a <Suspense> boundary while a page section
 * streams in — a plain spinning circle, distinct from the pulsing-block
 * skeletons used for whole-route loading.tsx files. */
export function SectionSpinner({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex min-h-28 items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-500 ${className}`}
    >
      <SpinnerIcon className="h-5 w-5" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
