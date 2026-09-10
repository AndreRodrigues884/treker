export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-36 rounded bg-zinc-800" />
        <div className="h-4 w-72 rounded bg-zinc-900" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-zinc-900/40" />
        ))}
      </div>
    </div>
  );
}
