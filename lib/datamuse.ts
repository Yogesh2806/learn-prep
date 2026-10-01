import { cached, TTL } from "./client-cache";
import { fetchJSON } from "./net";

// Datamuse — word relationships. Used for synonyms and for *look-alike* quiz
// distractors: words spelled like the answer, which tempt without being correct.

type DM = { word: string; score: number; tags?: string[] };

export async function synonyms(word: string, max = 5): Promise<string[]> {
  const { value } = await cached(`dm:syn:${word}`, TTL.forever, () =>
    fetchJSON<DM[]>(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=${max}`, { timeoutMs: 8_000, backoff: [800] }),
  );
  return value.map((d) => d.word).filter((w) => !w.includes(" "));
}

const POS: Record<string, string> = { adjective: "adj", noun: "n", verb: "v", adverb: "adv" };

/** pos: the answer's part of speech ("adjective"…), so the distractor reads as a plausible answer. */
export async function lookalikes(word: string, max = 3, pos?: string): Promise<string[]> {
  const w = word.toLowerCase();
  const pattern = w.slice(0, 3) + "?".repeat(Math.max(2, w.length - 3));
  const { value } = await cached(`dm:sp2:${pattern}`, TTL.forever, () =>
    fetchJSON<DM[]>(`https://api.datamuse.com/words?sp=${encodeURIComponent(pattern)}&md=fp&max=60`, { timeoutMs: 8_000, backoff: [800] }),
  );
  const freq = (d: DM) => Number(d.tags?.find((t) => t.startsWith("f:"))?.slice(2) ?? 0);
  const want = pos ? POS[pos] : undefined;
  const same = (d: DM) => (want && d.tags?.includes(want) ? 1 : 0);
  return value
    .filter(
      (d) =>
        /^[a-z]+$/.test(d.word) && d.word !== w && d.word.slice(0, 5) !== w.slice(0, 5) && freq(d) > 1.5 &&
        !d.tags?.includes("prop") && // "catholics" for "cathartic"
        (w.endsWith("s") || !d.word.endsWith("s")), // bare plurals give themselves away
    )
    .sort((a, b) => same(b) - same(a) || freq(b) - freq(a))
    .slice(0, max)
    .map((d) => d.word);
}
