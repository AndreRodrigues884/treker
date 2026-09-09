export default function Loading() {
  return (
    <div className="max-w-2xl animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-zinc-800" />
        <div className="h-4 w-72 rounded bg-zinc-900" />
      </div>

      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-zinc-800" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-2xl bg-zinc-900" />
          <div className="h-16 rounded-2xl bg-zinc-900" />
          <div className="h-16 rounded-2xl bg-zinc-900" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-zinc-800" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 rounded-2xl bg-zinc-900" />
          <div className="h-14 rounded-2xl bg-zinc-900" />
          <div className="h-14 rounded-2xl bg-zinc-900" />
          <div className="h-14 rounded-2xl bg-zinc-900" />
          <div className="col-span-2 h-14 rounded-2xl bg-zinc-900" />
        </div>
      </div>

      <div className="h-11 w-full rounded-xl bg-zinc-900" />
    </div>
  );
}
