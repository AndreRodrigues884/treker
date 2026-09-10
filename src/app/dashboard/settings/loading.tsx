export default function Loading() {
  return (
    <div className="max-w-2xl animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-zinc-800" />
        <div className="h-4 w-72 rounded bg-zinc-900" />
      </div>

      <div className="flex gap-2 border-b border-zinc-800 pb-3">
        <div className="h-9 w-24 rounded-xl bg-zinc-900" />
        <div className="h-9 w-40 rounded-xl bg-zinc-900" />
        <div className="h-9 w-28 rounded-xl bg-zinc-900" />
        <div className="h-9 w-24 rounded-xl bg-zinc-900" />
      </div>

      <div className="space-y-3">
        <div className="h-11 w-full rounded-xl bg-zinc-900" />
        <div className="h-11 w-full rounded-xl bg-zinc-900" />
      </div>
    </div>
  );
}
