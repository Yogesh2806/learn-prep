import { KEYS, readJSON, writeJSON } from "./storage";
import { dayKey } from "./utils";

// XP, levels, per-topic accuracy and challenge results. All local, all offline.
//
// XP is earned for correct answers (not for opening screens), so it measures learning.
// Accuracy per tag ("tense:past-perfect", "grammar:Who vs whom", "vocab", "slang"…)
// drives adaptive practice: the daily challenge and weekly boss lean on weak tags.

export const XP = { correct: 10, review: 5, dailyBonus: 50, bossMax: 150 } as const;

export type XpState = { total: number; days: Record<string, number> };
export type Perf = Record<string, { r: number; w: number; last: string }>;
export type Challenges = { daily: Record<string, { score: number; total: number }>; boss: Record<string, { score: number; total: number }> };

export const loadXp = () => readJSON<XpState>(KEYS.xp, { total: 0, days: {} });
export const loadPerf = () => readJSON<Perf>(KEYS.perf, {});
export const loadChallenges = () => readJSON<Challenges>(KEYS.challenges, { daily: {}, boss: {} });

export function addXp(s: XpState, n: number): XpState {
  if (n <= 0) return s;
  const today = dayKey();
  const days = { ...s.days, [today]: (s.days[today] ?? 0) + n };
  // Keep ~2 months of daily totals — enough for "this week" and a history strip.
  const keys = Object.keys(days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete days[k];
  const next = { total: s.total + n, days };
  writeJSON(KEYS.xp, next);
  return next;
}

export function addResult(p: Perf, tag: string, correct: boolean): Perf {
  const cur = p[tag] ?? { r: 0, w: 0, last: dayKey() };
  const next = { ...p, [tag]: { r: cur.r + (correct ? 1 : 0), w: cur.w + (correct ? 0 : 1), last: dayKey() } };
  writeJSON(KEYS.perf, next);
  return next;
}

export function saveChallenge(c: Challenges, kind: "daily" | "boss", key: string, score: number, total: number): Challenges {
  const prev = c[kind][key];
  // Keep the best attempt.
  const next = prev && prev.score >= score ? c : { ...c, [kind]: { ...c[kind], [key]: { score, total } } };
  writeJSON(KEYS.challenges, next);
  return next;
}

// ---------------------------------------------------------------- levels
/** Level n needs 100 · n(n−1)/2 XP: 0, 100, 300, 600, 1000… — early levels come quickly. */
const need = (n: number) => (100 * n * (n - 1)) / 2;

export function level(total: number) {
  let n = 1;
  while (need(n + 1) <= total) n++;
  const from = need(n);
  const to = need(n + 1);
  return { n, into: total - from, span: to - from, progress: (total - from) / (to - from) };
}

export function xpThisWeek(s: XpState, now = new Date()) {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    sum += s.days[dayKey(d)] ?? 0;
  }
  return sum;
}

// ---------------------------------------------------------------- weak spots
/** Tags with enough attempts, weakest first. Accuracy is smoothed so one miss isn't "0%". */
export function weakSpots(p: Perf, min = 3) {
  return Object.entries(p)
    .filter(([, v]) => v.r + v.w >= min)
    .map(([tag, v]) => ({ tag, attempts: v.r + v.w, accuracy: (v.r + 1) / (v.r + v.w + 2) }))
    .filter((x) => x.accuracy < 0.75)
    .sort((a, b) => a.accuracy - b.accuracy);
}

/** Sampling weight for a tag: unseen and weak tags come up more. */
export function weight(p: Perf, tag: string) {
  const v = p[tag];
  if (!v) return 1.5;
  const acc = (v.r + 1) / (v.r + v.w + 2);
  return 0.4 + 2.2 * (1 - acc);
}

/** ISO-ish week key (Monday start), e.g. "2026-W40". */
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Human label for a perf tag. */
export function tagLabel(tag: string) {
  const [kind, ...rest] = tag.split(":");
  const name = rest.join(":");
  switch (kind) {
    case "tense":
      return name.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    case "grammar":
    case "punct":
      return name;
    case "design":
      return `Design · ${name}`;
    case "vocab":
      return "Vocabulary meanings";
    case "slang":
      return "Gen Z slang";
    case "writing":
      return "Writing";
    default:
      return tag;
  }
}
