const store = new Map<string, { expires: number; value: unknown }>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheClear(): void {
  store.clear();
}

export function searchCacheTtlMs(): number {
  const minutes = Number(process.env.SEARCH_CACHE_MINUTES ?? "15");
  return Math.max(1, minutes) * 60 * 1000;
}
