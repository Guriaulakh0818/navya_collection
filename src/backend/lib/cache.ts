type CacheEntry = { value: unknown; expiry: number };

const globalCache = globalThis as unknown as {
  navyaCache: Map<string, CacheEntry>;
};

if (!globalCache.navyaCache) {
  globalCache.navyaCache = new Map();
}

export const cache = {
  get(key: string) {
    const entry = globalCache.navyaCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      globalCache.navyaCache.delete(key);
      return null;
    }
    return entry.value;
  },
  set(key: string, value: unknown, ttlMs = 60000) {
    globalCache.navyaCache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  },
  delete(key: string) {
    globalCache.navyaCache.delete(key);
  },
  clear() {
    globalCache.navyaCache.clear();
  },
};
