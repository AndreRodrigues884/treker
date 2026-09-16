export default function Loading() {
  return (
    <div className="max-w-2xl animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-slate-700" />
        <div className="h-4 w-72 rounded bg-slate-800" />
      </div>

      <div className="flex gap-2 border-b border-slate-700 pb-3">
        <div className="h-9 w-24 rounded-xl bg-slate-800" />
        <div className="h-9 w-40 rounded-xl bg-slate-800" />
        <div className="h-9 w-28 rounded-xl bg-slate-800" />
        <div className="h-9 w-24 rounded-xl bg-slate-800" />
      </div>

      <div className="space-y-3">
        <div className="h-11 w-full rounded-xl bg-slate-800" />
        <div className="h-11 w-full rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}
