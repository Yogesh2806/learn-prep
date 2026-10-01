import "server-only";
import { PROMPT_VERSION } from "../ai-types";
import bakedJson from "../baked-ai.json";

// Teaching content that doesn't need to be live — Word of the Day lessons, memory hooks,
// Design extras, tense examples — is generated ahead of time by scripts/bake.mts with the
// same prompts and validators as the live tasks, and served from here in milliseconds.
// It costs nothing per learner, so it works for everyone, with or without an AI engine.

type Baked = { version: number; items: Record<string, unknown> };
const BAKED = bakedJson as Baked;

export function baked(key: string): unknown | null {
  if (BAKED.version !== PROMPT_VERSION) return null;
  return Object.prototype.hasOwnProperty.call(BAKED.items, key) ? BAKED.items[key] : null;
}
