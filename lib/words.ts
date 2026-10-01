import { ai } from "./ai";
import type { Sense } from "./ai-types";
import { lookup, type DictEntry } from "./dictionary";
import { WORD_POOL } from "./english-data";
import { dayKey, daysBetween, mulberry32, shuffle } from "./utils";

export type WordCard = {
  word: string;
  entry: DictEntry;
  sense: Sense;
  example: string | null;
  /** True when the AI picked the everyday sense; false = we fell back to the first sense. */
  sensePicked: boolean;
  stale: boolean;
};

/**
 * Dictionary facts + an AI-chosen everyday sense. The definition text is always the
 * dictionary's; the AI only picks WHICH sense (e.g. "visceral" lists the anatomical one
 * first) and writes an example. If the AI is unavailable we still show the first sense.
 */
export async function loadWordCard(word: string, { needExample = true } = {}): Promise<{ value: WordCard; stale: boolean }> {
  const { value: entry, stale } = await lookup(word);
  let sense = entry.senses[0];
  let example: string | null = sense.example ?? null;
  // Pool words arrive with the everyday sense already first; only other words need a pick.
  let sensePicked = !!entry.curated || entry.senses.length === 1;
  if (!sensePicked || (!example && needExample)) {
    const senses = sensePicked ? [sense] : entry.senses;
    try {
      const r = await ai("word-sense", { word, senses }, { cacheKey: `${word}:${senses.length}:${senses[0].definition.length}`, quick: true });
      sense = senses[r.value.sense] ?? sense;
      example = r.value.example;
      sensePicked = true;
    } catch {
      /* teaching layer down — dictionary facts still stand */
    }
  }
  return { value: { word, entry, sense, example, sensePicked, stale }, stale };
}

/** Stable per calendar day for every learner: a fixed shuffle of the pool, one per day. */
export function wordOfTheDay(date = new Date()) {
  const order = shuffle(WORD_POOL, mulberry32(20260928));
  const n = daysBetween("2026-01-01", dayKey(date));
  return order[((n % order.length) + order.length) % order.length];
}

/** Run async jobs with a small concurrency cap (free APIs dislike bursts). */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        try {
          out[i] = { status: "fulfilled", value: await fn(items[i]) };
        } catch (reason) {
          out[i] = { status: "rejected", reason };
        }
      }
    }),
  );
  return out;
}
