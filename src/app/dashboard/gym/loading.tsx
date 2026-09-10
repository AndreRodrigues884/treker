export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-20 rounded bg-zinc-800" />
        <div className="h-4 w-64 rounded bg-zinc-900" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-900/40" />
        ))}
      </div>
    </div>
  );
}
