import { cacheGet } from "./client-cache";
import type { DictEntry } from "./dictionary";
import { GRAMMAR_TOPICS, PUNCTUATION_TOPICS, WORD_POOL } from "./english-data";
import { TOPIC_LESSONS } from "./english-lessons";
import { weight, type Perf } from "./gamify";
import { SLANG } from "./slang";
import { FALLBACK_DRILLS } from "./tense-fallback";
import { TENSE_BY_ID } from "./tense-meta";
import { mulberry32, shuffle } from "./utils";

// Daily challenge and weekly boss: built entirely from curated, hand-checked content, so
// they work offline and every answer key is trustworthy. Picks lean toward weak tags.

export type CQ = { tag: string; kind: string; prompt: string; detail?: string; options: string[]; answer: number; why: string };
type Source = "tense" | "grammar" | "punct" | "slang" | "vocab";

function pickWeighted<T>(items: T[], w: (x: T) => number, rand: () => number): T | undefined {
  const total = items.reduce((s, x) => s + w(x), 0);
  let r = rand() * total;
  for (const x of items) if ((r -= w(x)) <= 0) return x;
  return items[items.length - 1];
}

function shuffled(options: string[], answer: number, rand: () => number) {
  const order = shuffle(options.map((_, n) => n), rand);
  return { options: order.map((n) => options[n]), answer: order.indexOf(answer) };
}

function tenseQ(perf: Perf, rand: () => number, used: Set<string>): CQ | null {
  const d = pickWeighted(FALLBACK_DRILLS.filter((x) => !used.has(`tense:${x.tense}`)), (x) => weight(perf, `tense:${x.tense}`), rand);
  if (!d) return null;
  const s = shuffled(d.options, d.answer, rand);
  return { tag: `tense:${d.tense}`, kind: "Tenses", prompt: d.sentence.replace("___", "_____"), detail: `(${d.verb})`, ...s, why: `${TENSE_BY_ID[d.tense].name}: ${d.why}` };
}

function topicQ(kind: "grammar" | "punct", perf: Perf, rand: () => number, used: Set<string>): CQ | null {
  const topics = (kind === "grammar" ? GRAMMAR_TOPICS : PUNCTUATION_TOPICS) as readonly string[];
  const t = pickWeighted(topics.filter((x) => !used.has(`${kind}:${x}`)), (x) => weight(perf, `${kind}:${x}`), rand);
  if (!t) return null;
  const p = TOPIC_LESSONS[t as keyof typeof TOPIC_LESSONS].practice;
  const s = shuffled(p.options, p.answer, rand);
  return { tag: `${kind}:${t}`, kind: kind === "grammar" ? "Grammar" : "Punctuation", prompt: p.question, detail: t, ...s, why: p.why };
}

function slangQ(rand: () => number, used: Set<string>): CQ {
  const pool = SLANG.filter((x) => !used.has(`slang-term:${x.term}`));
  const s = pool[Math.floor(rand() * pool.length)];
  used.add(`slang-term:${s.term}`);
  const others = shuffle(SLANG.filter((x) => x.term !== s.term), rand).slice(0, 3);
  const o = shuffled([s.meaning, ...others.map((x) => x.meaning)], 0, rand);
  return { tag: "slang", kind: "Gen Z slang", prompt: `What does “${s.term}” mean?`, ...o, why: `“${s.example}”` };
}

/** Vocabulary questions use words whose dictionary entry is already on this device. */
function vocabQ(rand: () => number, used: Set<string>): CQ | null {
  const known = shuffle(WORD_POOL as readonly string[], rand)
    .filter((w) => !used.has(`vocab-word:${w}`))
    .map((w) => [w, cacheGet<DictEntry>(`word:${w}`, { allowStale: true })] as const)
    .find(([, e]) => e?.senses.length);
  if (!known) return null;
  const [word, entry] = known;
  used.add(`vocab-word:${word}`);
  const others = shuffle((WORD_POOL as readonly string[]).filter((w) => w !== word), rand).slice(0, 3);
  const o = shuffled([word, ...others], 0, rand);
  return { tag: "vocab", kind: "Vocabulary", prompt: "Which word means…", detail: entry!.senses[0].definition, ...o, why: `“${word}” — ${entry!.senses[0].definition}` };
}

function build(plan: Source[], perf: Perf, seed: number): CQ[] {
  const rand = mulberry32(seed);
  const used = new Set<string>();
  const out: CQ[] = [];
  for (const src of plan) {
    const q =
      src === "tense" ? tenseQ(perf, rand, used)
      : src === "grammar" || src === "punct" ? topicQ(src, perf, rand, used)
      : src === "vocab" ? vocabQ(rand, used) ?? tenseQ(perf, rand, used)
      : slangQ(rand, used);
    if (!q) continue;
    used.add(q.tag);
    out.push(q);
  }
  return out;
}

/** Five quick questions, one from each area. Stable for the day. */
export const dailyChallenge = (perf: Perf, seed: number) => build(["vocab", "tense", "grammar", "punct", "slang"], perf, seed);

/** Twelve harder-mix questions, weighted toward weak spots. */
export const bossQuiz = (perf: Perf, seed: number) =>
  build(["tense", "grammar", "tense", "punct", "grammar", "vocab", "tense", "punct", "grammar", "slang", "tense", "grammar"], perf, seed);

export const seedOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 17);
