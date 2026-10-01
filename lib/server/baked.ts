import "server-only";
import { PROMPT_VERSION, type AiTask } from "../ai-types";
import bakedJson from "../baked-ai.json";

// Teaching content that doesn't need to be live — Word of the Day lessons, memory hooks,
// Design extras, tense examples — is generated ahead of time by scripts/bake.mts with the
// same prompts and validators as the live tasks, and served from here in milliseconds.
// Everything else (Doubt Solver, drills, fresh checks) stays live.

type Baked = { version: number; items: Record<string, unknown> };
const BAKED = bakedJson as Baked;

/** The key a baked answer is stored under, or null if this task is always live. */
export function bakeKey(task: AiTask, input: unknown): string | null {
  const i = input as Record<string, unknown>;
  switch (task) {
    case "word-teach":
      return `word-teach:${String(i.word).toLowerCase()}`;
    case "mnemonic":
      return `mnemonic:${String(i.term).toLowerCase()}`;
    case "design-extras":
      return `design-extras:${String(i.term).toLowerCase()}`;
    case "tense-explain":
      return `tense-explain:${String(i.tense)}`;
    default:
      return null;
  }
}

export function baked(task: AiTask, input: unknown): unknown | null {
  if (BAKED.version !== PROMPT_VERSION) return null;
  const key = bakeKey(task, input);
  return key ? (BAKED.items[key] ?? null) : null;
}
