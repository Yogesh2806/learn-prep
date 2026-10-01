import type { TenseId } from "./tense-meta";

/** Bump after changing any prompt: it keys both the server and the on-device caches. */
export const PROMPT_VERSION = 2;

// The contract between the UI and the AI layer (lib/ai.ts). Every engine's output is
// validated by the task's check in lib/ai-tasks.ts before the UI sees it.

export type Sense = { pos: string; definition: string; example?: string };
export type MCQ = { question: string; options: string[]; answer: number; why: string };
export type Mistake = { wrong: string; right: string; why: string };
export type TenseDrill = { sentence: string; verb: string; options: string[]; answer: number; tense: TenseId; why: string };
export type GrammarCardContent = { rule: string; whereToApply: string; examples: string[]; mistake: Mistake; practice: MCQ };
export type PunctItem = { broken: string; fixed: string; why: string };

export type AiTasks = {
  "design-extras": { in: { term: string; definition: string }; out: { wild: string; interview: string } };
  "explain-differently": { in: { term: string; definition: string }; out: { explanation: string } };
  mnemonic: { in: { term: string; definition: string }; out: { hook: string } };
  "word-sense": { in: { word: string; senses: Sense[] }; out: { sense: number; example: string } };
  "word-teach": {
    in: { word: string; senses: Sense[] };
    out: { sense: number; examples: string[]; heardIn: string[]; origin: string; check: MCQ };
  };
  "doubt-answer": {
    in: { question: string; history: { q: string; a: string }[] };
    out: { onTopic: boolean; answer: string; examples: string[] };
  };
  "explain-corrections": {
    in: { sentence: string; issues: { text: string; suggestion: string; rule: string }[] };
    out: { notes: string[]; tip: string };
  };
  "tense-drills": { in: { focus: TenseId | null; seed: number }; out: { drills: TenseDrill[] } };
  "tense-explain": { in: { tense: TenseId }; out: { uses: { label: string; example: string }[] } };
  /** Fresh examples and an extra check on top of the curated card (lib/english-lessons.ts). */
  "grammar-card": { in: { topic: string; kind: "grammar" | "punctuation"; seed: number }; out: { examples: string[]; practice: MCQ } };
  "writing-grade": {
    in: { mode: "rewrite" | "free"; original: string | null; text: string; issues: { text: string; suggestion: string; rule: string }[] };
    out: { score: number; headline: string; points: { good: boolean; note: string }[]; rewrite: string };
  };
  "punct-drills": { in: { topic: string; seed: number }; out: { items: PunctItem[] } };
};

export type AiTask = keyof AiTasks;
export type AiIn<T extends AiTask> = AiTasks[T]["in"];
export type AiOut<T extends AiTask> = AiTasks[T]["out"];
