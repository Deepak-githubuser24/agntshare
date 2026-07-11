import { NextRequest } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 * Per-key (user id or IP), fixed window that slides every `windowMs`.
 *
 * NOT persistent across server restarts — acceptable for MVP.
 * Swap to Redis (INCR + EXPIRE) for production durability.
 */

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Evict stale entries every 60 seconds to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

export interface RateLimitConfig {
  /** Max requests allowed in the window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check (and consume) a request against the rate limit for `key`.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count++;

  if (entry.count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract a rate-limit key from a request: prefer userId, fall back to IP.
 */
export function rateLimitKey(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `ip:${ip}`;
}

/** Default config: 60 requests per minute. */
export const API_RATE_LIMIT: RateLimitConfig = {
  max: 60,
  windowMs: 60_000,
};
