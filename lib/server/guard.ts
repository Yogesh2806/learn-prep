import "server-only";

// Protects the paid-for (or free-tier) key once the app is deployed publicly: only
// same-origin browser requests, a per-IP rate limit, and small request bodies.

export function forbiddenOrigin(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const site = req.headers.get("sec-fetch-site");
  if (site) return site !== "same-origin";
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

const buckets = new Map<string, { tokens: number; at: number }>();

/** Token bucket: `perMinute` requests per IP per route, refilled continuously. */
export function rateLimited(req: Request, route: string, perMinute: number): boolean {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const key = `${route}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: perMinute, at: now };
  b.tokens = Math.min(perMinute, b.tokens + ((now - b.at) / 60_000) * perMinute);
  b.at = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return true;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 5000) buckets.clear();
  return false;
}

export async function readBody(req: Request, maxBytes = 16_000): Promise<unknown> {
  const raw = await req.text();
  if (raw.length > maxBytes) throw new Error("too large");
  return JSON.parse(raw);
}

/** Tiny LRU so identical prompts within a server's life never hit the model twice. */
export class LRU<V> {
  private map = new Map<string, V>();
  constructor(private max: number) {}
  get(k: string) {
    const v = this.map.get(k);
    if (v !== undefined) {
      this.map.delete(k);
      this.map.set(k, v);
    }
    return v;
  }
  set(k: string, v: V) {
    this.map.delete(k);
    this.map.set(k, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
