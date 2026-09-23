import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";

// Unlike plain @upstash/redis, this library's Lua scripts use an
// Upstash-proprietary EVAL shebang flag (`allow-key-locking`) that only
// real Upstash-hosted Redis understands — the local docker-compose Redis
// (vanilla redis:7-alpine) rejects it with "Unexpected flag in script
// shebang". So this specific piece can't be exercised against local
// Redis; it's still correct code, just only verifiable against the real
// Upstash instance (e.g. after deploying, or with cloud env vars).

/** Keyed by client IP, one limiter per sensitive action — login gets a
 * slightly more generous window than signup/OAuth since a real user can
 * genuinely mistype their password a couple of times in a row. */
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:login",
});

export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "ratelimit:signup",
});

export const oauthRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "ratelimit:oauth",
});

/** Vercel (and most proxies) set x-forwarded-for to "client, proxy1,
 * proxy2..." — the first entry is the original client. Falls back to
 * "unknown" for local dev, where no proxy sets this header at all; every
 * local request then shares one bucket, which is fine for testing. */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}
