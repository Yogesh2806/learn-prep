import type { Sense } from "./ai-types";
import { cacheGet, cacheSet, TTL } from "./client-cache";
import { fetchJSON } from "./net";

/** curated: senses[0] is the reviewed everyday sense for pool words. */
export type DictEntry = { word: string; ipa: string | null; audio: string | null; senses: Sense[]; synonyms: string[]; sources: string[]; curated?: boolean };

/**
 * Look a word up via /api/word (which merges the Free Dictionary API and Wiktionary).
 * Complete entries are kept on the device for good; partial ones (no IPA/audio yet) are
 * kept a day, so the next visit picks up the fuller entry once the slow source answers.
 */
const inflight = new Map<string, Promise<DictEntry>>();

export async function lookup(word: string): Promise<{ value: DictEntry; stale: boolean }> {
  const w = word.trim().toLowerCase();
  const key = `word:${w}`;
  const fresh = cacheGet<DictEntry>(key);
  if (fresh) return { value: fresh, stale: false };
  try {
    let pending = inflight.get(w);
    if (!pending) {
      pending = fetchJSON<DictEntry>(`/api/word?w=${encodeURIComponent(w)}`, { timeoutMs: 20_000, backoff: [1_500] }).finally(() => inflight.delete(w));
      inflight.set(w, pending);
    }
    const value = await pending;
    const complete = value.sources[0] === "Free Dictionary API" && !!value.ipa;
    cacheSet(key, value, complete ? TTL.forever : TTL.day);
    return { value, stale: false };
  } catch (e) {
    const old = cacheGet<DictEntry>(key, { allowStale: true });
    if (old) return { value: old, stale: true };
    throw e;
  }
}
