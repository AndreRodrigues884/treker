export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-slate-700" />
        <div className="h-4 w-72 rounded bg-slate-800" />
      </div>
      <div className="h-16 rounded-2xl bg-slate-800/40" />
      <div className="h-32 rounded-2xl bg-slate-800/40" />
      <div className="h-40 rounded-2xl bg-slate-800/40" />
    </div>
  );
}
