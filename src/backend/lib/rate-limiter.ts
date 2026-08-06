/**
 * Sliding Window Token Rate Limiter for API Routes.
 */
interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  limit?: number; // max requests allowed per window
  windowMs?: number; // duration of window in ms
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {},
): { allowed: boolean; remaining: number; resetMs: number } {
  const limit = options.limit || 60; // 60 requests
  const windowMs = options.windowMs || 60 * 1000; // 1 minute window

  const now = Date.now();
  const record = rateLimitStore.get(key) || { tokens: limit, lastRefill: now };

  // Calculate token refill
  const elapsed = now - record.lastRefill;
  if (elapsed > windowMs) {
    record.tokens = limit;
    record.lastRefill = now;
  }

  if (record.tokens > 0) {
    record.tokens -= 1;
    rateLimitStore.set(key, record);
    return {
      allowed: true,
      remaining: record.tokens,
      resetMs: windowMs - (now - record.lastRefill),
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetMs: windowMs - (now - record.lastRefill),
  };
}
