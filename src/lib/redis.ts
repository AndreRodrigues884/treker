import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client (REST-based, works from serverless/edge runtimes).
 *
 * In local dev, point these env vars at the serverless-redis-http proxy
 * started by `docker compose up` (see docker-compose.yml) instead of a real
 * Upstash database — it speaks the same REST protocol against a local
 * Redis container.
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
