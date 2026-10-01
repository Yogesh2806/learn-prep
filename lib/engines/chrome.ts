import { AiError } from "./errors";

// Chrome's built-in model (Gemini Nano, via the Prompt API). It runs on the learner's
// device: free, private, offline once Chrome has downloaded it. Desktop Chrome only for
// now, and smaller than cloud Gemini, so answers are a little less sharp.

type Availability = "unavailable" | "downloadable" | "downloading" | "available";
type Session = {
  prompt(text: string, opts?: { responseConstraint?: unknown; signal?: AbortSignal }): Promise<string>;
  clone(opts?: { signal?: AbortSignal }): Promise<Session>;
  destroy(): void;
};
type Monitor = { addEventListener(type: "downloadprogress", fn: (e: { loaded: number }) => void): void };
type LanguageModelApi = {
  availability(opts?: unknown): Promise<Availability>;
  create(opts?: unknown): Promise<Session>;
};

const LANGS = { expectedInputs: [{ type: "text", languages: ["en"] }], expectedOutputs: [{ type: "text", languages: ["en"] }] };

function api(): LanguageModelApi | null {
  return typeof self !== "undefined" && "LanguageModel" in self ? (self as unknown as { LanguageModel: LanguageModelApi }).LanguageModel : null;
}

export async function chromeAvailability(): Promise<Availability> {
  const lm = api();
  if (!lm) return "unavailable";
  try {
    return await lm.availability(LANGS);
  } catch {
    return "unavailable";
  }
}

// One base session holding the system prompt; each request runs on a clone of it, so no
// request sees another's conversation.
let base: Promise<Session> | null = null;
let baseSystem = "";

/** Creates the base session. When the model still needs downloading, call this from a click. */
export function chromePrepare(system: string, onProgress?: (fraction: number) => void): Promise<Session> {
  const lm = api();
  if (!lm) return Promise.reject(new AiError("unsupported", "This browser doesn't have Chrome's built-in AI."));
  if (base && baseSystem === system) return base;
  baseSystem = system;
  base = lm
    .create({
      ...LANGS,
      initialPrompts: [{ role: "system", content: system }],
      monitor(m: Monitor) {
        m.addEventListener("downloadprogress", (e) => onProgress?.(e.loaded));
      },
    })
    .catch((e) => {
      base = null;
      throw new AiError("unsupported", `Chrome's built-in AI couldn't start${e instanceof Error && e.message ? `: ${e.message}` : "."}`);
    });
  return base;
}

// The on-device model works best one request at a time.
let queue: Promise<unknown> = Promise.resolve();

export function chromeGenerate(system: string, prompt: string, schema: unknown, timeoutMs: number): Promise<string> {
  const run = async () => {
    const session = await (await chromePrepare(system)).clone();
    try {
      return await session.prompt(prompt, { responseConstraint: schema, signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) throw new AiError("busy", "Chrome's built-in AI took too long.");
      if (e instanceof DOMException && e.name === "NotSupportedError") throw new AiError("unsupported", "Chrome's built-in AI can't handle this request.");
      throw new AiError("busy", "Chrome's built-in AI didn't answer.");
    } finally {
      session.destroy();
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => {});
  return next;
}
