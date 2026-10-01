import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { AiError } from "./errors";

// An open model (Qwen2.5 1.5B Instruct) downloaded once into the browser and run on the
// GPU with WebGPU. Works in any WebGPU browser, offline after the download, and nothing
// leaves the device. It's the smallest of the three engines, so it's labelled as such.
// The library (several MB) is only loaded for learners who turn this on.

export const WEBLLM_MODEL = { name: "Qwen2.5 1.5B", size: "about 1 GB" };
const IDS = { f16: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", f32: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC" };

type Gpu = { requestAdapter(): Promise<{ features: Set<string> } | null> };

/** Which build this device can run (half-precision shaders are faster), or null without WebGPU. */
export async function webllmModelId(): Promise<string | null> {
  const gpu = typeof navigator !== "undefined" ? (navigator as unknown as { gpu?: Gpu }).gpu : undefined;
  if (!gpu) return null;
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return null;
    return adapter.features.has("shader-f16") ? IDS.f16 : IDS.f32;
  } catch {
    return null;
  }
}

let engine: Promise<MLCEngineInterface> | null = null;
let progressListener: ((fraction: number, text: string) => void) | null = null;

/** Downloads (first time) or loads from the browser cache, then keeps the model in memory. */
export function webllmLoad(onProgress?: (fraction: number, text: string) => void): Promise<MLCEngineInterface> {
  if (onProgress) progressListener = onProgress;
  if (engine) return engine;
  engine = (async () => {
    const id = await webllmModelId();
    if (!id) throw new AiError("unsupported", "This browser doesn't support WebGPU, which the in-browser model needs.");
    const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
    const worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), { type: "module" });
    return CreateWebWorkerMLCEngine(worker, id, {
      initProgressCallback: (r) => progressListener?.(r.progress, r.text),
    });
  })().catch((e) => {
    engine = null;
    throw e instanceof AiError ? e : new AiError("unsupported", `The in-browser model couldn't start${e instanceof Error && e.message ? `: ${e.message}` : "."}`);
  });
  return engine;
}

export async function webllmRemove() {
  const id = await webllmModelId();
  const loaded = engine;
  engine = null;
  await loaded?.then((e) => e.unload()).catch(() => {});
  if (!id) return;
  const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
  await Promise.all(Object.values(IDS).map((m) => deleteModelAllInfoInCache(m).catch(() => {})));
}

// One request at a time — it's one GPU.
let queue: Promise<unknown> = Promise.resolve();

export function webllmGenerate(system: string, prompt: string, schema: unknown, temperature: number, timeoutMs: number): Promise<string> {
  const run = async () => {
    const e = await webllmLoad();
    const timer = setTimeout(() => e.interruptGenerate(), timeoutMs);
    const started = Date.now();
    try {
      const r = await e.chat.completions.create({
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${prompt}\n\nReply with JSON matching this schema:\n${JSON.stringify(schema)}` },
        ],
        temperature: Math.min(temperature, 0.7),
        max_tokens: 900,
        response_format: { type: "json_object", schema: JSON.stringify(schema) },
      });
      if (Date.now() - started >= timeoutMs) throw new AiError("busy", "The in-browser model took too long.");
      return r.choices[0]?.message?.content ?? "";
    } catch (err) {
      if (err instanceof AiError) throw err;
      throw new AiError("busy", "The in-browser model didn't answer.");
    } finally {
      clearTimeout(timer);
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => {});
  return next;
}
