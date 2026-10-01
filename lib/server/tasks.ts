import "server-only";
import type { AiIn, AiOut, AiTask, MCQ } from "../ai-types";
import { TOPIC_LESSONS } from "../english-lessons";
import { TENSE_BY_ID, TENSE_IDS, TENSE_LESSONS, isTenseId } from "../tense-meta";

// ---------------------------------------------------------------- schema helpers
// Gemini's responseSchema is an OpenAPI subset (upper-case type names).
type Schema = Record<string, unknown>;
const str = (): Schema => ({ type: "STRING" });
const int = (): Schema => ({ type: "INTEGER" });
const bool = (): Schema => ({ type: "BOOLEAN" });
const arr = (items: Schema, min?: number, max?: number): Schema => ({
  type: "ARRAY",
  items,
  ...(min != null ? { minItems: min } : {}),
  ...(max != null ? { maxItems: max } : {}),
});
const obj = (properties: Record<string, Schema>): Schema => ({ type: "OBJECT", properties, required: Object.keys(properties) });
const mcqSchema = obj({ question: str(), options: arr(str(), 3, 3), answer: int(), why: str() });

// ---------------------------------------------------------------- input guards
export class InputError extends Error {}

function text(v: unknown, field: string, max: number, min = 1): string {
  if (typeof v !== "string") throw new InputError(`${field} must be text`);
  const s = v.replace(/\s+/g, " ").trim();
  if (s.length < min) throw new InputError(`${field} is empty`);
  if (s.length > max) throw new InputError(`${field} is too long (max ${max} characters)`);
  return s;
}
function list<T>(v: unknown, field: string, max: number, map: (x: unknown, i: number) => T): T[] {
  if (!Array.isArray(v)) throw new InputError(`${field} must be a list`);
  if (v.length > max) throw new InputError(`${field} has too many items`);
  return v.map(map);
}
function num(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) throw new InputError(`${field} must be a number`);
  return Math.floor(v);
}
const q = (s: string) => JSON.stringify(s); // safe quoting of learner text inside prompts

// ---------------------------------------------------------------- output checks
const isStr = (x: unknown, min = 1): x is string => typeof x === "string" && x.trim().length >= min;
const strs = (x: unknown, min: number, max: number) => Array.isArray(x) && x.length >= min && x.length <= max && x.every((s) => isStr(s));
function goodMcq(m: unknown): m is MCQ {
  const c = m as MCQ;
  return (
    !!c && isStr(c.question) && strs(c.options, 3, 3) && new Set(c.options.map((o) => o.trim().toLowerCase())).size === 3 &&
    Number.isInteger(c.answer) && c.answer >= 0 && c.answer < 3 && isStr(c.why)
  );
}
const lettersOnly = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// ---------------------------------------------------------------- task registry
type TaskDef<T extends AiTask> = {
  /** fast = Flash-Lite first; quality = full Flash first. Both fall back down the chain. */
  tier: "fast" | "quality";
  temperature: number;
  schema: Schema;
  parse(raw: unknown): AiIn<T>;
  prompt(input: AiIn<T>): string;
  /** Return the cleaned output, or null if the model's answer can't be trusted. */
  check(out: AiOut<T>, input: AiIn<T>): AiOut<T> | null;
};

const termInput = (raw: unknown) => {
  const r = raw as Record<string, unknown>;
  return { term: text(r?.term, "term", 120), definition: text(r?.definition, "definition", 600) };
};

const sensesInput = (raw: unknown) => {
  const r = raw as Record<string, unknown>;
  return {
    word: text(r?.word, "word", 60),
    senses: list(r?.senses, "senses", 10, (s) => {
      const o = s as Record<string, unknown>;
      return {
        pos: text(o?.pos, "pos", 30),
        definition: text(o?.definition, "definition", 400),
        ...(typeof o?.example === "string" && o.example.trim() ? { example: text(o.example, "example", 300) } : {}),
      };
    }),
  };
};
const sensesBlock = (senses: { pos: string; definition: string }[]) => senses.map((s, i) => `${i}: ${s.pos} — ${s.definition}`).join("\n");

export const TASKS: { [K in AiTask]: TaskDef<K> } = {
  "design-extras": {
    tier: "fast",
    temperature: 0.8,
    schema: obj({ wild: str(), interview: str() }),
    parse: termInput,
    prompt: ({ term, definition }) => `Product-design interview term: ${q(term)}
Authoritative definition — do not contradict or redefine it: ${q(definition)}

Return:
- wild: 1–2 sentences on where someone would notice this in an everyday app or website. Generic and recognisable; make no factual claims about a named company.
- interview: one sentence a candidate could say in a design interview that uses the term naturally, in the first person, without quotation marks.`,
    check: (o) => (isStr(o?.wild, 12) && isStr(o?.interview, 12) ? { wild: o.wild.trim(), interview: o.interview.trim().replace(/^["“]|["”]$/g, "") } : null),
  },

  "explain-differently": {
    tier: "fast",
    temperature: 0.8,
    schema: obj({ explanation: str() }),
    parse: termInput,
    prompt: ({ term, definition }) => `Explain ${q(term)} differently from this definition: ${q(definition)}
Use one everyday analogy. At most 3 short sentences. Stay consistent with the definition.`,
    check: (o) => (isStr(o?.explanation, 20) ? { explanation: o.explanation.trim() } : null),
  },

  mnemonic: {
    tier: "fast",
    temperature: 0.9,
    schema: obj({ hook: str() }),
    parse: termInput,
    prompt: ({ term, definition }) => `Give a memory hook for ${q(term)}, meaning: ${q(definition)}
Wordplay, a vivid image or an acronym — at most 2 sentences. It should make an adult smile, not cringe.`,
    check: (o) => (isStr(o?.hook, 10) ? { hook: o.hook.trim() } : null),
  },

  "word-sense": {
    tier: "fast",
    temperature: 0.4,
    schema: obj({ sense: int(), example: str() }),
    parse: sensesInput,
    prompt: ({ word, senses }) => `Word: ${q(word)}
Dictionary senses (index: part of speech — definition):
${sensesBlock(senses)}

Pick the sense a learner is most likely to hear in everyday adult conversation, interviews, reviews or news — not a technical, archaic or rare one. Then write one natural example sentence using the word in exactly that sense, set in everyday life or media rather than the workplace.
Return sense (the index) and example.`,
    check: (o, i) => (Number.isInteger(o?.sense) && o.sense >= 0 && o.sense < i.senses.length && isStr(o?.example, 8) ? { sense: o.sense, example: o.example.trim() } : null),
  },

  "word-teach": {
    tier: "fast",
    temperature: 0.7,
    schema: obj({ sense: int(), examples: arr(str(), 2, 2), heardIn: arr(str(), 3, 3), origin: str(), check: mcqSchema }),
    parse: sensesInput,
    prompt: ({ word, senses }) => `Word of the day: ${q(word)}
Dictionary senses (index: part of speech — definition):
${sensesBlock(senses)}

1. sense: the index of the sense a learner most often hears in everyday adult conversation, interviews, reviews or the news (not technical, archaic or rare).
2. examples: 2 natural sentences using the word in that sense — one from everyday conversation, and one as it might be said in a celebrity interview, sports commentary, a film review or the news. Not about design, product work or offices. Do not attribute them to real people.
3. heardIn: 3 short lowercase contexts (2–3 words each) where the general public genuinely hears this word — e.g. "film reviews", "sports commentary", "celebrity interviews", "news headlines". Never workplace jargon.
4. origin: one sentence of etymology. If you are not confident, answer exactly "Origin unclear."
5. check: a quick question testing the MEANING (not spelling), with exactly 3 options and exactly one correct; answer is the 0-based index of the correct option; why is one sentence.`,
    check: (o, i) => {
      if (!(Number.isInteger(o?.sense) && o.sense >= 0 && o.sense < i.senses.length)) return null;
      if (!strs(o.examples, 2, 2) || !strs(o.heardIn, 3, 3) || !isStr(o.origin) || !goodMcq(o.check)) return null;
      return { ...o, heardIn: o.heardIn.map((h) => h.trim().toLowerCase()) };
    },
  },

  "doubt-answer": {
    tier: "quality",
    temperature: 0.4,
    schema: obj({ onTopic: bool(), answer: str(), examples: arr(str(), 0, 3) }),
    parse: (raw) => {
      const r = raw as Record<string, unknown>;
      return {
        question: text(r?.question, "question", 1000),
        history: list(r?.history ?? [], "history", 3, (h) => {
          const o = h as Record<string, unknown>;
          return { q: text(o?.q, "history question", 600), a: text(o?.a, "history answer", 1200) };
        }),
      };
    },
    prompt: ({ question, history }) => `A learner asks about the English language (grammar, vocabulary, usage, punctuation, pronunciation or style).
${history.length ? `Earlier in this session, oldest first:\n${history.map((h) => `Q: ${q(h.q)}\nA: ${q(h.a)}`).join("\n")}\n` : ""}
Question: ${q(question)}

Answer directly in at most 120 words, like a patient, precise teacher. Prefer a clear rule plus the reason. Then give 0–3 short example sentences that show the point in use (an empty list if they wouldn't help).
If the question is not about the English language, set onTopic to false and in answer say in one sentence that you can only help with English here.`,
    check: (o) =>
      typeof o?.onTopic === "boolean" && isStr(o?.answer, 2) && Array.isArray(o?.examples)
        ? { onTopic: o.onTopic, answer: o.answer.trim(), examples: o.examples.filter((e) => isStr(e)).slice(0, 3) }
        : null,
  },

  "explain-corrections": {
    tier: "fast",
    temperature: 0.3,
    schema: obj({ notes: arr(str()), tip: str() }),
    parse: (raw) => {
      const r = raw as Record<string, unknown>;
      return {
        sentence: text(r?.sentence, "sentence", 2000),
        issues: list(r?.issues, "issues", 12, (x) => {
          const o = x as Record<string, unknown>;
          return { text: text(o?.text, "text", 200), suggestion: text(o?.suggestion ?? "—", "suggestion", 200), rule: text(o?.rule, "rule", 300) };
        }),
      };
    },
    prompt: ({ sentence, issues }) => `Learner's text: ${q(sentence)}
A grammar checker flagged these issues (index: flagged text → suggested fix — checker's note):
${issues.map((x, i) => `${i}: ${q(x.text)} → ${q(x.suggestion)} — ${x.rule}`).join("\n")}

For each issue, in the same order, write ONE plain-English sentence explaining the rule behind it — why it's wrong — not merely restating the fix.
Return notes (exactly ${issues.length}, same order) and tip: one short sentence the learner can remember next time, or an empty string.`,
    check: (o, i) => (strs(o?.notes, i.issues.length, i.issues.length) && typeof o?.tip === "string" ? { notes: o.notes.map((n) => n.trim()), tip: o.tip.trim() } : null),
  },

  "tense-drills": {
    tier: "fast",
    temperature: 0.9,
    schema: obj({
      drills: arr(obj({ sentence: str(), verb: str(), options: arr(str(), 3, 3), answer: int(), tense: { type: "STRING", enum: TENSE_IDS }, why: str() }), 5, 6),
    }),
    parse: (raw) => {
      const r = raw as Record<string, unknown>;
      if (r?.focus != null && !isTenseId(r.focus)) throw new InputError("unknown tense");
      return { focus: (r?.focus ?? null) as AiIn<"tense-drills">["focus"], seed: num(r?.seed ?? 0, "seed") };
    },
    prompt: ({ focus, seed }) => {
      const t = focus ? TENSE_BY_ID[focus] : null;
      return `Write 5 "which tense fits?" drills for intermediate-to-advanced learners${t ? `, ALL of them testing the ${t.name} (${t.formula}): ${t.meaning}` : ", covering a varied mix of the 12 English tenses"}.
Each drill:
- sentence: a natural sentence containing exactly one blank written as ___ where the verb phrase goes. It must contain the clue that decides the tense (a time marker, another clause, context).
- verb: the base form of the verb that fills the blank.
- options: 3 complete verb phrases for the blank, all built from that verb. Exactly one is correct and natural; the other two must be clearly wrong in THIS context, not merely less common. Don't include the subject unless the blank requires it.
- answer: 0-based index of the correct option.
- tense: the tense of the correct option, one of: ${TENSE_IDS.join(", ")}.
- why: 1–2 sentences on when this tense is used and which clue in the sentence points to it.
Vary subjects, verbs and situations (work, travel, friendships, study, sport). Variation seed: ${seed}.`;
    },
    check: (o, i) => {
      if (!Array.isArray(o?.drills)) return null;
      const good = o.drills.filter(
        (d) =>
          isStr(d?.sentence) && d.sentence.split("___").length === 2 && isStr(d.verb) && strs(d.options, 3, 3) &&
          new Set(d.options.map((x) => x.trim().toLowerCase())).size === 3 && Number.isInteger(d.answer) && d.answer >= 0 && d.answer < 3 &&
          isTenseId(d.tense) && (!i.focus || d.tense === i.focus) && isStr(d.why),
      );
      return good.length >= 3 ? { drills: good } : null;
    },
  },

  "tense-explain": {
    tier: "fast",
    temperature: 0.8,
    schema: obj({ uses: arr(obj({ label: str(), example: str() }), 3, 3) }),
    parse: (raw) => {
      const r = raw as Record<string, unknown>;
      if (!isTenseId(r?.tense)) throw new InputError("unknown tense");
      return { tense: r.tense };
    },
    // The uses, mistake and clue words are curated (TENSE_LESSONS); the model only adds
    // fresh examples, so it's told what the learner has already seen.
    prompt: ({ tense }) => {
      const t = TENSE_BY_ID[tense];
      const seen = TENSE_LESSONS[tense].uses.map((u) => `- ${u.example}`).join("\n");
      return `Tense: ${t.name} (${t.formula}). Core meaning: ${t.meaning}
The learner has already seen these examples:
${seen}
Return uses: 3 NEW examples, each { label: the use in 2–5 words, example: one natural sentence using the ${t.name} }.
Draw them from everyday life — work chats, travel, sport, films and TV, the news. Vary the subjects and verbs; don't reuse the sentences above.`;
    },
    check: (o) => (Array.isArray(o?.uses) && o.uses.length === 3 && o.uses.every((u) => isStr(u?.label) && isStr(u?.example)) ? o : null),
  },

  "grammar-card": {
    tier: "fast",
    temperature: 0.9,
    schema: obj({ examples: arr(str(), 2, 2), practice: mcqSchema }),
    parse: (raw) => {
      const r = raw as Record<string, unknown>;
      const kind = r?.kind === "punctuation" ? "punctuation" : "grammar";
      const topic = text(r?.topic, "topic", 80);
      if (!(topic in TOPIC_LESSONS)) throw new InputError("unknown topic");
      return { topic, kind, seed: num(r?.seed ?? 0, "seed") };
    },
    // The rule, mistake and first check are curated; the model writes new material around them.
    prompt: ({ topic, kind, seed }) => {
      const c = TOPIC_LESSONS[topic as keyof typeof TOPIC_LESSONS];
      return `${kind === "punctuation" ? "Punctuation" : "Grammar"} topic: ${q(topic)}, for intermediate-to-advanced learners.
The rule: ${c.rule}
The learner has already seen these examples: ${c.examples.map(q).join(" ")}
and this check: ${q(c.practice.question)}
Return:
- examples: 2 NEW correct example sentences from everyday life, work, sport, films or the news.
- practice: a NEW multiple-choice check { question, options (exactly 3), answer (0-based index), why }, with exactly one correct option under the rule above.
Variation seed: ${seed}.`;
    },
    check: (o) => (strs(o?.examples, 2, 2) && goodMcq(o?.practice) ? o : null),
  },

  "writing-grade": {
    tier: "fast",
    temperature: 0.3,
    schema: obj({ score: int(), headline: str(), points: arr(obj({ good: bool(), note: str() }), 2, 4), rewrite: str() }),
    parse: (raw) => {
      const r = raw as Record<string, unknown>;
      const mode = r?.mode === "free" ? "free" : "rewrite";
      return {
        mode,
        original: mode === "rewrite" ? text(r?.original, "original", 400) : null,
        text: text(r?.text, "text", 1200),
        issues: list(r?.issues, "issues", 15, (x) => {
          const o = x as Record<string, unknown>;
          return { text: text(o?.text, "text", 200), suggestion: text(o?.suggestion ?? "—", "suggestion", 200), rule: text(o?.rule, "rule", 300) };
        }),
      };
    },
    prompt: ({ mode, original, text: t, issues }) => `${
      mode === "rewrite"
        ? `Rewrite challenge. The learner was asked to make this awkward sentence clearer and more natural without changing its meaning:\n${q(original!)}\nTheir version:\n${q(t)}`
        : `Free writing. The learner wrote:\n${q(t)}`
    }
A grammar checker found ${issues.length ? "these objective errors:\n" + issues.map((x) => `- ${q(x.text)} → ${q(x.suggestion)} (${x.rule})`).join("\n") : "no objective errors."}

Grade it like a kind, precise writing coach for an intermediate-to-advanced learner.
- score: 0–100 for clarity, concision, correctness and naturalness${mode === "rewrite" ? ", and how well it fixed the original's problem while keeping the meaning" : ""}. Each checker error costs points.
- headline: 3–7 words summing up the result (e.g. "Much tighter than the original").
- points: 2–4 specific notes. good=true for something they did well, good=false for something to fix. Quote their exact words when pointing at a problem. Don't repeat the checker's spelling errors — those are shown separately.
- rewrite: a cleaner version of THEIR text, keeping their meaning and voice. If it's already excellent, return it with only tiny changes.`,
    check: (o) => {
      if (!Number.isFinite(o?.score) || !isStr(o?.headline) || !isStr(o?.rewrite) || !Array.isArray(o?.points)) return null;
      const points = o.points.filter((p) => typeof p?.good === "boolean" && isStr(p?.note)).slice(0, 4);
      if (!points.length) return null;
      return { score: Math.max(0, Math.min(100, Math.round(o.score))), headline: o.headline.trim(), points, rewrite: o.rewrite.trim() };
    },
  },

  "punct-drills": {
    tier: "fast",
    temperature: 0.9,
    schema: obj({ items: arr(obj({ broken: str(), fixed: str(), why: str() }), 4, 5) }),
    parse: (raw) => {
      const r = raw as Record<string, unknown>;
      return { topic: text(r?.topic, "topic", 80), seed: num(r?.seed ?? 0, "seed") };
    },
    prompt: ({ topic, seed }) => `Write 4 "fix the punctuation" exercises on: ${q(topic)}.
Each item:
- fixed: a natural sentence that uses this punctuation correctly.
- broken: the SAME sentence with only its punctuation (and capitalisation, if needed) broken so the rule is violated. The words must be identical and in the same order.
- why: one sentence naming the rule.
Vary the situations. Variation seed: ${seed}.`,
    // Guarantee the drill is purely about punctuation: identical words either side.
    check: (o) => {
      if (!Array.isArray(o?.items)) return null;
      const good = o.items.filter((x) => isStr(x?.broken) && isStr(x?.fixed) && isStr(x?.why) && x.broken.trim() !== x.fixed.trim() && lettersOnly(x.broken) === lettersOnly(x.fixed));
      return good.length >= 3 ? { items: good } : null;
    },
  },
};

export const SYSTEM_INSTRUCTION = `You are the teaching layer inside Learn Prep, a study app with two subjects: product-design interview vocabulary, and everyday English for intermediate-to-advanced learners. Each request says which subject it is about — keep English lessons about everyday life and media, not about design or the workplace, unless the request says otherwise.
Write in plain, warm, confident language. No markdown, no emoji, no preamble.
Never invent statistics or studies, and never attribute quotes to real people.
Keep everything suitable for a general, professional audience.
Output only JSON that matches the provided schema.`;

export function isTask(x: unknown): x is AiTask {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(TASKS, x);
}
