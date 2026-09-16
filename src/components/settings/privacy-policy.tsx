export function PrivacyPolicy() {
  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-slate-700 bg-slate-800/40 p-5 text-sm leading-relaxed text-zinc-400">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">
          What we store
        </h3>
        <p>
          Your email, your name if you add one, and the training data you
          log — sports, goals, exercises, sets, and session history. That&apos;s
          it: no third-party analytics or ad trackers are wired into this
          app.
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">
          Where it lives
        </h3>
        <p>
          Everything is stored in this project&apos;s Supabase (Postgres)
          database, access-controlled so your rows are only ever readable
          and writable by your own account.
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">
          Sharing
        </h3>
        <p>
          Your data isn&apos;t sold or shared with third parties. It&apos;s used
          only to run the app for you — computing your charts, streaks and
          stats.
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">
          Deleting your account
        </h3>
        <p>
          There&apos;s no self-serve delete button yet — reach out to the app
          owner to have your account and all associated data removed.
        </p>
      </div>
    </div>
  );
}
