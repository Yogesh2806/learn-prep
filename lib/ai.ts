import { PROMPT_VERSION, type AiIn, type AiOut, type AiResponse, type AiTask } from "./ai-types";
import { cached, TTL } from "./client-cache";
import { fetchJSON } from "./net";

// Client entry to the teaching layer. Every answer is cached on the device by
// task + input, so a card you've seen once works instantly — and offline.

export async function ai<T extends AiTask>(
  task: T,
  input: AiIn<T>,
  /** quick: one short attempt (7s, or the ms given) for content the UI has a fallback for.
   *  The server keeps working after we give up and caches the answer, so the next ask is
   *  usually instant. */
  opts: { ttl?: number; cacheKey?: string; quick?: boolean | number } = {},
): Promise<{ value: AiOut<T>; stale: boolean }> {
  const key = `ai:v${PROMPT_VERSION}:${task}:${opts.cacheKey ?? JSON.stringify(input)}`;
  return cached(key, opts.ttl ?? TTL.month, async () => {
    const res = await fetchJSON<AiResponse<T>>("/api/llm", {
      timeoutMs: typeof opts.quick === "number" ? opts.quick : opts.quick ? 7_000 : 30_000,
      backoff: opts.quick ? [] : [1_500, 4_000],
      init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, input }) },
    });
    return res.data;
  });
}
