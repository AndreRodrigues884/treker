export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-800" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-800" />
          <div className="h-7 w-40 rounded bg-slate-700" />
          <div className="h-4 w-48 rounded bg-slate-800" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-full bg-slate-800" />
        <div className="h-9 w-24 rounded-full bg-slate-800" />
      </div>
      <div className="h-16 rounded-2xl bg-slate-800/40" />
      <div className="space-y-3">
        <div className="h-40 rounded-2xl bg-slate-800/40" />
        <div className="h-28 rounded-2xl bg-slate-800/40" />
        <div className="h-28 rounded-2xl bg-slate-800/40" />
      </div>
    </div>
  );
}
