export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-6 w-40 rounded bg-zinc-800" />
        <div className="h-4 w-56 rounded bg-zinc-900" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-24 rounded-full bg-zinc-900" />
        <div className="h-8 w-28 rounded-full bg-zinc-900" />
      </div>
    </div>
  );
}
