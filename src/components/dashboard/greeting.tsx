"use client";

import { useEffect, useState } from "react";

/**
 * Time-of-day greeting, computed from the viewer's own clock. Starts
 * with a neutral fallback and only swaps in the real greeting after
 * mount — using the server's clock instead would guess wrong for
 * anyone not in the same timezone as wherever the app is deployed, and
 * computing it during SSR would mismatch the client on hydration.
 */
export function Greeting({
  name,
  email,
}: {
  /** Preferred display identity — set from Settings > Profile. Falls
   * back to the account email until the user adds one. */
  name?: string | null;
  email: string;
}) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // This has to run post-mount, client-only: the server's clock (or a
    // different visitor's timezone) would guess the wrong time of day,
    // and computing it during the initial render would mismatch between
    // SSR and hydration. Starting from a neutral "Hello" and swapping it
    // in here is the standard fix for exactly that.
    const hour = new Date().getHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(hour < 12 ? "Good morning" : hour < 19 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <p className="text-zinc-400">
      {greeting}, <span className="text-zinc-200">{name || email}</span>
    </p>
  );
}
