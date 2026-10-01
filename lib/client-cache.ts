import { keysWithPrefix, readJSON, removeKey, writeJSON } from "./storage";

// A small persistent cache for dictionary, Datamuse and AI responses. It is what makes
// repeat views instant and what "offline" means in this app: everything already seen.

const PREFIX = "lp.c.";
const MAX_ENTRIES = 700;
const DAY = 86_400_000;

type Entry<T> = { v: T; t: number; ttl: number };

export const TTL = {
  day: DAY,
  week: 7 * DAY,
  month: 30 * DAY,
  forever: 3650 * DAY,
};

function k(key: string) {
  return PREFIX + key;
}

export function cacheGet<T>(key: string, { allowStale = false } = {}): T | undefined {
  const e = readJSON<Entry<T> | null>(k(key), null);
  if (!e) return undefined;
  if (!allowStale && Date.now() - e.t > e.ttl) return undefined;
  return e.v;
}

export function cacheSet<T>(key: string, value: T, ttl = TTL.month) {
  if (!writeJSON(k(key), { v: value, t: Date.now(), ttl } satisfies Entry<T>)) {
    evict(Math.ceil(MAX_ENTRIES / 4)); // quota hit: drop the oldest quarter and retry once
    writeJSON(k(key), { v: value, t: Date.now(), ttl });
  }
  maybeEvict();
}

let writes = 0;
function maybeEvict() {
  if (++writes % 25 !== 0) return;
  const keys = keysWithPrefix(PREFIX);
  if (keys.length > MAX_ENTRIES) evict(keys.length - MAX_ENTRIES);
}

function evict(n: number) {
  const aged = keysWithPrefix(PREFIX)
    .map((key) => ({ key, t: readJSON<Entry<unknown> | null>(key, null)?.t ?? 0 }))
    .sort((a, b) => a.t - b.t);
  aged.slice(0, n).forEach((e) => removeKey(e.key));
}

export function cacheClearAll() {
  keysWithPrefix(PREFIX).forEach(removeKey);
}

/**
 * Serve fresh cache, else fetch, else fall back to stale cache. The `stale` flag lets a
 * panel say "showing Tuesday's copy" rather than pretend the data is live.
 */
// Concurrent asks for the same key share one request (a prefetch and the real load).
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<{ value: T; stale: boolean }> {
  const fresh = cacheGet<T>(key);
  if (fresh !== undefined) return { value: fresh, stale: false };
  try {
    let pending = inflight.get(key) as Promise<T> | undefined;
    if (!pending) {
      pending = load().finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }
    const value = await pending;
    cacheSet(key, value, ttl);
    return { value, stale: false };
  } catch (err) {
    const old = cacheGet<T>(key, { allowStale: true });
    if (old !== undefined) return { value: old, stale: true };
    throw err;
  }
}
