import { after } from "next/server";
import { forbiddenOrigin, json, LRU, rateLimited } from "@/lib/server/guard";
import { freeDictionary, hasSnapshot, merge, wiktionary, type WordEntry } from "@/lib/server/words";

// GET /api/word?w=visceral → definitions, IPA, audio and the sources that answered.
// Wiktionary answers in ~0.5s; the Free Dictionary API was measured at ~20s with 522s,
// so we don't make the learner wait for it: it gets a short head start, and if it's
// late it finishes after the response and upgrades the cached entry for next time.
// Pool words ship with a saved copy, so they answer instantly and refresh behind.

const cache = new LRU<WordEntry>(1500);
const refreshing = new Set<string>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const complete = (e: WordEntry) => e.sources[0] === "Free Dictionary API";
const headers = (e: WordEntry) => ({ "Cache-Control": complete(e) ? "public, max-age=86400" : "no-store" });

export async function GET(req: Request) {
  if (forbiddenOrigin(req)) return json({ error: "Forbidden." }, 403);
  if (rateLimited(req, "word", 90)) return json({ error: "Too many lookups — slow down a little.", retryable: true }, 429);

  const w = (new URL(req.url).searchParams.get("w") ?? "").trim().toLowerCase();
  if (!/^[a-z][a-z' -]{0,40}$/.test(w)) return json({ error: "That doesn't look like a word." }, 400);

  const hit = cache.get(w);
  if (hit && (complete(hit) || hasSnapshot(w))) return json(hit, 200, headers(hit));

  if (hasSnapshot(w)) {
    const saved = merge(w, null, [])!;
    if (!refreshing.has(w)) {
      refreshing.add(w);
      after(async () => {
        try {
          const [fd, wk] = await Promise.all([freeDictionary(w, 25_000).catch(() => null), wiktionary(w, 6_000).catch(() => [])]);
          const live = merge(w, fd, wk);
          if (live) cache.set(w, live);
        } finally {
          refreshing.delete(w);
        }
      });
    }
    return json(saved, 200, headers(saved));
  }

  const fdPromise = freeDictionary(w, 25_000).catch(() => null);
  const wk = await wiktionary(w, 6_000).catch(() => []);
  const fd = await Promise.race([fdPromise, sleep(wk.length ? 2_500 : 12_000).then(() => undefined)]);

  const entry = merge(w, fd ?? null, wk);
  if (fd === undefined) {
    after(async () => {
      const late = await fdPromise;
      const upgraded = late ? merge(w, late, wk) : null;
      if (upgraded) cache.set(w, upgraded);
    });
  }
  if (!entry) return json({ error: `No dictionary entry for “${w}”.` }, 404);
  cache.set(w, entry);
  // Only let browsers keep complete entries for a day; partial ones should refresh.
  return json(entry, 200, headers(entry));
}
