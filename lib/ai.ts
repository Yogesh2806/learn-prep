import { ENGINE_LABEL, getAiSettings, readyEngines, type EngineId } from "./ai-settings";
import { bakeKey, InputError, SYSTEM_INSTRUCTION, TASKS, toJsonSchema } from "./ai-tasks";
import { PROMPT_VERSION, type AiIn, type AiOut, type AiTask } from "./ai-types";
import { cached, TTL } from "./client-cache";
import { chromeGenerate } from "./engines/chrome";
import { AiError } from "./engines/errors";
import { generate } from "./engines/gemini";

// Client entry to the teaching layer. In order:
//   1. this device's cache — anything seen once is instant, and works offline;
//   2. pre-generated answers from the server (free for everyone, no model call);
//   3. the learner's engine from Settings, falling back to any other engine that's ready.
// Every engine's answer passes the task's own check (lib/ai-tasks.ts) before it's shown.

export type AiResult<T extends AiTask> = { value: AiOut<T>; stale: boolean; via: string };
type Stored = { data: unknown; via: string };

export async function ai<T extends AiTask>(
  task: T,
  raw: AiIn<T>,
  /** quick: wait at most 7s (or the ms given) for content the UI has a fallback for. The
   *  engine keeps working after we give up and caches the answer, so the next ask is
   *  usually instant. */
  opts: { ttl?: number; cacheKey?: string; quick?: boolean | number } = {},
): Promise<AiResult<T>> {
  const def = TASKS[task];
  let input: AiIn<T>;
  try {
    input = def.parse(raw) as AiIn<T>;
  } catch (e) {
    throw new AiError("invalid", e instanceof InputError ? e.message : "Invalid input.", false);
  }

  const key = `ai3:v${PROMPT_VERSION}:${task}:${opts.cacheKey ?? JSON.stringify(input)}`;
  const pending = cached<Stored>(key, opts.ttl ?? TTL.month, () => load(task, input));
  const r = opts.quick ? await within(pending, typeof opts.quick === "number" ? opts.quick : 7_000) : await pending;
  return { value: r.value.data as AiOut<T>, stale: r.stale, via: r.value.via };
}

function within<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new AiError("busy", "The AI is taking a while.")), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

async function load<T extends AiTask>(task: T, input: AiIn<T>): Promise<Stored> {
  const bk = bakeKey(task, input);
  if (bk) {
    const ready = await fetchBaked(bk);
    if (ready) return { data: ready, via: "Pre-generated" };
  }

  const engines = await readyEngines();
  if (!engines.length) {
    throw new AiError(
      "setup",
      getAiSettings().engine === "off"
        ? "AI is switched off. Turn it on in Settings for this feature."
        : "Set up AI in Settings for this feature: add your free Gemini key, or use an on-device model.",
      false,
    );
  }

  let first: unknown;
  for (const id of engines) {
    try {
      return { data: await run(id, task, input), via: ENGINE_LABEL[id] };
    } catch (e) {
      first ??= e;
      if (e instanceof AiError && e.kind === "blocked") break;
    }
  }
  throw first; // the preferred engine's error is the one worth showing
}

async function fetchBaked(key: string): Promise<unknown | null> {
  try {
    const res = await fetch(`/api/baked?v=${PROMPT_VERSION}&k=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: unknown }).data ?? null;
  } catch {
    return null; // offline or slow: go straight to the engine
  }
}

async function run<T extends AiTask>(id: EngineId, task: T, input: AiIn<T>): Promise<unknown> {
  const def = TASKS[task];
  const prompt = def.prompt(input as never);
  const check = (raw: unknown) => def.check(raw as never, input as never);

  if (id === "gemini") {
    const r = await generate({ key: getAiSettings().key, system: SYSTEM_INSTRUCTION, prompt, schema: def.schema, tier: def.tier, temperature: def.temperature, accept: check });
    return r.data;
  }

  // On-device models are smaller: allow a second try when an answer fails the checks.
  const schema = toJsonSchema(def.schema);
  const timeoutMs = def.tier === "quality" ? 60_000 : 45_000;
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text =
      id === "chrome"
        ? await chromeGenerate(SYSTEM_INSTRUCTION, prompt, schema, timeoutMs)
        : await (await import("./engines/webllm")).webllmGenerate(SYSTEM_INSTRUCTION, prompt, schema, def.temperature, timeoutMs);
    try {
      const ok = check(JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")));
      if (ok != null) return ok;
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof AiError ? last : new AiError("invalid", "The on-device model's answer didn't pass our checks.");
}
