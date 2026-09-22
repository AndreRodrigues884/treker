import { signInWithGoogleAction } from "@/lib/actions/auth";

/** Google/OAuth doesn't distinguish "sign in" from "sign up" — this one
 * button (and action) covers both pages; the callback route decides
 * onboarding vs. dashboard the same way email/password login does. */
export function GoogleButton() {
  return (
    <form action={signInWithGoogleAction}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-slate-500 hover:bg-slate-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
          <path
            fill="#EA4335"
            d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.6-6.6C35.3 2.6 30 0.5 24 0.5 14.6 0.5 6.5 5.9 2.6 13.8l7.7 6C12.1 13.6 17.5 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.4 5.7C43.9 37.6 46.5 31.6 46.5 24.5z"
          />
          <path
            fill="#FBBC05"
            d="M10.3 19.8a14.5 14.5 0 0 0 0 8.4l-7.7 6a24 24 0 0 1 0-20.4l7.7 6z"
          />
          <path
            fill="#34A853"
            d="M24 47.5c6 0 11.3-2 15.1-5.3l-7.4-5.7c-2 1.4-4.6 2.2-7.7 2.2-6.5 0-11.9-4.1-13.7-9.8l-7.7 6C6.5 42.1 14.6 47.5 24 47.5z"
          />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
