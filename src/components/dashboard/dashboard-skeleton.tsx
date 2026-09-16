export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-40 rounded bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-800" />
      </div>
      <div className="h-20 rounded-2xl bg-slate-800/40" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-slate-800/40" />
        <div className="h-24 rounded-2xl bg-slate-800/40" />
        <div className="h-24 rounded-2xl bg-slate-800/40" />
      </div>
    </div>
  );
}
