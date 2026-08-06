export interface RateLimitPolicy {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

interface CounterEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, CounterEntry>();

// Periodic memory store cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of memoryStore.entries()) {
        if (now > entry.resetTime) {
          memoryStore.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  );
}

/**
 * Sliding window rate limiting implementation
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    const newEntry: CounterEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    memoryStore.set(identifier, newEntry);
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetMs: windowMs,
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs: Math.max(0, entry.resetTime - now),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetMs: Math.max(0, entry.resetTime - now),
  };
}

/**
 * Predefined Rate Limit Policies
 */
export const RATE_LIMIT_POLICIES = {
  OTP: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 req / 10 min
  LOGIN: { limit: 10, windowMs: 10 * 60 * 1000 }, // 10 req / 10 min
  SEARCH: { limit: 100, windowMs: 60 * 1000 }, // 100 req / 1 min
  CHECKOUT: { limit: 10, windowMs: 10 * 60 * 1000 }, // 10 req / 10 min
  CONTACT: { limit: 10, windowMs: 10 * 60 * 1000 }, // 10 req / 10 min
  REVIEWS: { limit: 10, windowMs: 10 * 60 * 1000 }, // 10 req / 10 min
  ADMIN_API: { limit: 30, windowMs: 60 * 1000 }, // 30 req / 1 min
};
