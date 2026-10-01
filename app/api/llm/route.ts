import { PROMPT_VERSION } from "@/lib/ai-types";
import { generate, ModelError } from "@/lib/server/gemini";
import { baked } from "@/lib/server/baked";
import { forbiddenOrigin, json, LRU, rateLimited, readBody } from "@/lib/server/guard";
import { InputError, isTask, SYSTEM_INSTRUCTION, TASKS } from "@/lib/server/tasks";

// POST /api/llm  { task, input }  →  { data, model, cached }
// The only route that talks to Gemini. Inputs are validated per task, outputs are
// schema-constrained and checked before they leave the server.

const cache = new LRU<{ data: unknown; model: string }>(800);
// Identical requests already on their way to the model share that one call.
const inflight = new Map<string, Promise<{ data: unknown; model: string }>>();

export async function POST(req: Request) {
  if (forbiddenOrigin(req)) return json({ error: "Forbidden." }, 403);

  let body: { task?: unknown; input?: unknown };
  try {
    body = (await readBody(req)) as typeof body;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (!isTask(body.task)) return json({ error: "Unknown task." }, 400);

  const def = TASKS[body.task];
  let input: unknown;
  try {
    input = def.parse(body.input as never);
  } catch (e) {
    return json({ error: e instanceof InputError ? e.message : "Invalid input." }, 400);
  }

  // Pre-generated answers (scripts/bake.ts) cost no model call and no wait.
  const ready = baked(body.task, input);
  if (ready) return json({ data: ready, model: "baked", cached: true });

  const key = `${PROMPT_VERSION}:${body.task}:${JSON.stringify(input)}`;
  const hit = cache.get(key);
  if (hit) return json({ ...hit, cached: true });
  // Only real model calls count toward the limit.
  if (rateLimited(req, "llm", 40)) return json({ error: "Too many requests — slow down a little.", retryable: true }, 429, { "Retry-After": "10" });

  try {
    let pending = inflight.get(key);
    if (!pending) {
      pending = generate({
        system: SYSTEM_INSTRUCTION,
        prompt: def.prompt(input as never),
        schema: def.schema,
        tier: def.tier,
        temperature: def.temperature,
        accept: (raw) => def.check(raw as never, input as never),
      });
      inflight.set(key, pending);
      pending.then(() => inflight.delete(key), () => inflight.delete(key));
    }
    const result = await pending;
    cache.set(key, result);
    return json({ ...result, cached: false });
  } catch (e) {
    if (e instanceof ModelError) return json({ error: e.message, retryable: e.retryable }, e.status);
    console.error("[llm]", e);
    return json({ error: "Unexpected server error.", retryable: true }, 500);
  }
}
