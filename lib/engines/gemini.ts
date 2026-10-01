import { AiError } from "./errors";

// Gemini, called with the learner's own key. It runs in the browser — the request goes
// straight to Google, so Learn Prep's server never sees the key — and in Node for the
// bake script. Every call asks for schema-constrained JSON. On the free tier any single model is unreliable (measured:
// 503 "high demand", 429 daily quota, 2–8s answers), so this layer:
//   • remembers each model's health and tries healthy ones first,
//   • hedges — if the first model hasn't answered in a few seconds, a second races it,
//   • caps concurrent calls, because bursts of 10 were measured to all stall.

const CHAINS = {
  // Lite models first: their free-tier daily quotas are far larger than Flash's.
  fast: ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash"],
  quality: ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"],
};

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** Start a second model if the first hasn't answered by then. */
const HEDGE_MS = { fast: 3_500, quality: 6_000 } as const;
const PER_MODEL_MS = { fast: 10_000, quality: 20_000 } as const;
const CHAIN_BUDGET_MS = { fast: 18_000, quality: 35_000 } as const;
const MAX_IN_FLIGHT = 4;

export type Args = {
  key: string;
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  tier: "fast" | "quality";
  temperature: number;
  /** Rejects outputs the task can't trust; returning null moves on to the next model. */
  accept: (parsed: unknown) => unknown | null;
  /** Override the timing, e.g. for large batch jobs in scripts/bake.mts. */
  timing?: { hedgeMs: number; perModelMs: number; budgetMs: number };
};

function parseJSON(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(t);
}

// ---------------------------------------------------------------- model health
type Health = { coolUntil: number; ms: number };
const health = new Map<string, Health>();
/** How long to leave a model alone after each kind of failure. */
const COOL = { overloaded: 30_000, timeout: 30_000, missing: 6 * 60 * 60_000 };

/**
 * Free-tier quotas are per model and small (measured: 20 requests/day for 3.5 Flash).
 * A per-day quota rests the model for hours; a per-minute one for the delay Google asks.
 */
function quotaCool(body: string) {
  if (/PerDay/i.test(body)) return 3 * 60 * 60_000;
  const delay = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  return delay ? Math.ceil(Number(delay[1])) * 1000 + 1_000 : 60_000;
}

function note(model: string, outcome: { ok: true; ms: number } | { ok: false; cool: number }) {
  const h = health.get(model) ?? { coolUntil: 0, ms: 3_000 };
  if (outcome.ok) health.set(model, { coolUntil: 0, ms: Math.round(h.ms * 0.6 + outcome.ms * 0.4) });
  else health.set(model, { ...h, coolUntil: Date.now() + outcome.cool });
}

/** Healthy models first (in configured order), cooling ones last as a final resort. */
function ranked(chain: string[]) {
  const now = Date.now();
  const cooling = (m: string) => (health.get(m)?.coolUntil ?? 0) > now;
  return [...chain.filter((m) => !cooling(m)), ...chain.filter(cooling)];
}

// Thinking: Flash models accept different levels (3.6 takes "minimal", 3.8 only "low"),
// so step down on a 400 and remember what each model accepts. Lite models don't think.
const THINKING = ["minimal", "low", null] as const;
const thinkingFor = new Map<string, number>();

// ---------------------------------------------------------------- concurrency cap
let inFlight = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_IN_FLIGHT) await new Promise<void>((r) => waiting.push(r));
  inFlight++;
  try {
    return await fn();
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}

// ---------------------------------------------------------------- one model
async function tryModel(model: string, args: Args, timeoutMs: number, stop: AbortSignal): Promise<{ data: unknown; model: string }> {
  const key = args.key;
  if (!key) throw new AiError("setup", "Add your Gemini key in Settings.");
  const started = Date.now();
  const signal = AbortSignal.any([stop, AbortSignal.timeout(timeoutMs)]);

  for (let level = model.includes("lite") ? 2 : (thinkingFor.get(model) ?? 0); level < THINKING.length; level++) {
    const generationConfig: Record<string, unknown> = { responseMimeType: "application/json", responseSchema: args.schema, temperature: args.temperature };
    if (THINKING[level]) generationConfig.thinkingConfig = { thinkingLevel: THINKING[level] };

    let res: Response;
    try {
      res = await slot(() =>
        fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: args.system }] }, contents: [{ role: "user", parts: [{ text: args.prompt }] }], generationConfig }),
          signal,
          cache: "no-store",
        }),
      );
    } catch (e) {
      if (stop.aborted) throw e; // another model already won — not this model's fault
      const timedOut = e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError");
      console.warn(`[gemini] ${model} ${timedOut ? "timed out" : "unreachable"}`);
      note(model, { ok: false, cool: COOL.timeout });
      throw new AiError("busy", timedOut ? "Gemini took too long." : "Couldn't reach Gemini.");
    }

    if (res.ok) {
      const body = await res.json().catch(() => null);
      const cand = body?.candidates?.[0];
      if (cand?.finishReason === "SAFETY" || body?.promptFeedback?.blockReason) {
        throw new AiError("blocked", "That request was blocked by Gemini's safety filter.");
      }
      const text: string = (cand?.content?.parts ?? [])
        .filter((p: { thought?: boolean; text?: string }) => !p.thought && typeof p.text === "string")
        .map((p: { text: string }) => p.text)
        .join("");
      note(model, { ok: true, ms: Date.now() - started });
      thinkingFor.set(model, level);
      try {
        const accepted = args.accept(parseJSON(text));
        if (accepted != null) return { data: accepted, model };
      } catch {
        /* unparseable — fall through */
      }
      console.warn(`[gemini] ${model} answer rejected by validator`);
      throw new AiError("invalid", "The AI's answer didn't pass our checks.");
    }

    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const detail = await res.text().catch(() => "");
      if (res.status === 400 && /think/i.test(detail) && level < THINKING.length - 1) continue; // step down a thinking level
      throw keyProblem(detail) ?? new AiError("invalid", "Gemini rejected the request.", false);
    }
    // 404 = model not available to this key; 429 = quota; 5xx = overloaded.
    const cool = res.status === 404 ? COOL.missing : res.status === 429 ? quotaCool(await res.text().catch(() => "")) : COOL.overloaded;
    console.warn(`[gemini] ${model} → ${res.status}${res.status === 429 ? ` (resting ${Math.round(cool / 60_000)} min)` : ""}`);
    note(model, { ok: false, cool });
    throw res.status === 429
      ? new AiError("quota", "Your key hit Gemini's free-tier limit — try again in a minute.")
      : new AiError("busy", "Gemini is busy right now.");
  }
  throw new AiError("invalid", "Gemini rejected the request.", false);
}

/** Turns Google's key errors into something the learner can act on in Settings. */
function keyProblem(detail: string): AiError | null {
  if (/API_KEY_INVALID|API key not valid|API_KEY_EXPIRED/i.test(detail)) return new AiError("key", "Your Gemini key wasn't accepted. Check it in Settings.");
  if (/REFERRER|referer/i.test(detail)) return new AiError("key", "Your Gemini key is restricted to other websites. Add this site to its allowed websites in Google AI Studio.");
  if (/PERMISSION_DENIED|SERVICE_DISABLED|API_KEY_SERVICE_BLOCKED/i.test(detail)) return new AiError("key", "Your Gemini key can't use the Gemini API. Create a key in Google AI Studio.");
  return null;
}

/** Settings → "Save & test": one tiny call that only checks the key works. */
export async function testKey(key: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?pageSize=1`, { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
  } catch {
    throw new AiError("busy", "Couldn't reach Google to test the key. Check your connection.");
  }
  if (res.ok) return;
  const detail = await res.text().catch(() => "");
  if (/API_KEY_INVALID|API key not valid/i.test(detail)) throw new AiError("key", "Google didn't accept that key. Copy it again from Google AI Studio.");
  throw keyProblem(detail) ?? (res.status === 429 ? new AiError("quota", "The key works but is rate-limited right now.") : new AiError("key", `Google answered ${res.status}. Check the key.`));
}

// ---------------------------------------------------------------- the chain, hedged
export function generate(args: Args): Promise<{ data: unknown; model: string }> {
  const order = ranked(CHAINS[args.tier]);
  const t = args.timing ?? { hedgeMs: HEDGE_MS[args.tier], perModelMs: PER_MODEL_MS[args.tier], budgetMs: CHAIN_BUDGET_MS[args.tier] };
  const deadline = Date.now() + t.budgetMs;
  const stop = new AbortController();

  return new Promise((resolve, reject) => {
    let next = 0;
    let running = 0;
    let done = false;
    let lastError = new AiError("busy", "Gemini didn't answer.");

    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      stop.abort();
      fn();
    };

    // Starts the next model. Called at the start, on a failure (fail over at once) and
    // when the hedge timer fires (a slow model gets company instead of the whole budget).
    const launch = () => {
      if (done) return;
      const left = deadline - Date.now();
      if (next >= order.length || left < 1_500) {
        if (running === 0) finish(() => reject(lastError));
        return;
      }
      const model = order[next++];
      running++;
      const hedge = setTimeout(launch, t.hedgeMs);
      tryModel(model, args, Math.min(t.perModelMs, left), stop.signal).then(
        (r) => {
          clearTimeout(hedge);
          running--;
          finish(() => resolve(r));
        },
        (e) => {
          clearTimeout(hedge);
          running--;
          if (done) return;
          if (e instanceof AiError && !e.retryable) return finish(() => reject(e));
          if (e instanceof AiError) lastError = e;
          launch();
        },
      );
    };
    launch();
  });
}

/** For debugging: what this tab currently believes about each model. */
export function modelHealth() {
  const now = Date.now();
  return Object.fromEntries([...health].map(([m, h]) => [m, { avgMs: h.ms, coolingFor: Math.max(0, Math.round((h.coolUntil - now) / 1000)) }]));
}
