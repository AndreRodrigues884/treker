import Link from "next/link";

/**
 * Pure presentational — no data fetching, so it's easy to unit test.
 * src/app/page.tsx handles the auth check/redirect around this.
 */
export function LandingHero() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-linear-to-br from-slate-900 via-indigo-900 to-slate-900 px-6 py-24 text-center text-zinc-100">
      <div className="space-y-5">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
          Multi-modality training tracker
        </p>
        <h1 className="text-4xl font-bold sm:text-6xl">
          Train your way.
          <br className="hidden sm:block" /> Track everything.
        </h1>
        <p className="mx-auto max-w-xl text-zinc-400">
          Gym, swimming and running — one app, no auto-generated plans, no AI
          coaching. Built for athletes who already know how to train
          themselves.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-slate-600 px-8 py-3 text-sm font-semibold text-zinc-100 transition hover:border-slate-400 hover:bg-slate-800"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
