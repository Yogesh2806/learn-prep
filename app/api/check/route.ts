import { forbiddenOrigin, json, LRU, rateLimited, readBody } from "@/lib/server/guard";

// POST /api/check { text } → LanguageTool matches, trimmed to what the UI needs.
// Proxied (not called from the browser) so we can cache, rate-limit, and swap in a
// self-hosted LanguageTool with LANGUAGETOOL_URL — the public API allows ~20 req/min.

const ENDPOINT = process.env.LANGUAGETOOL_URL ?? "https://api.languagetool.org/v2/check";
const cache = new LRU<unknown>(300);

type LTMatch = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: { id: string; description: string; issueType?: string; category: { id: string; name: string } };
};

export async function POST(req: Request) {
  if (forbiddenOrigin(req)) return json({ error: "Forbidden." }, 403);
  if (rateLimited(req, "check", 18)) return json({ error: "Checking too fast — wait a few seconds.", retryable: true }, 429, { "Retry-After": "5" });

  let text: string;
  try {
    const body = (await readBody(req, 12_000)) as { text?: unknown };
    if (typeof body.text !== "string") throw new Error();
    text = body.text.trim();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (!text) return json({ error: "Nothing to check." }, 400);
  if (text.length > 4000) return json({ error: "Please check at most 4,000 characters at a time." }, 400);

  const hit = cache.get(text);
  if (hit) return json(hit);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ text, language: "en-US", enabledOnly: "false" }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (res.status === 429) return json({ error: "The grammar checker's free limit was hit — wait a minute.", retryable: true }, 429);
    if (!res.ok) return json({ error: "The grammar checker didn't answer.", retryable: true }, 503);
    const data = (await res.json()) as { matches: LTMatch[] };
    const out = {
      matches: data.matches.slice(0, 12).map((m) => ({
        offset: m.offset,
        length: m.length,
        text: text.slice(m.offset, m.offset + m.length),
        message: m.message,
        short: m.shortMessage || m.rule.description,
        replacements: m.replacements.slice(0, 3).map((r) => r.value),
        rule: m.rule.description,
        category: m.rule.category.name,
        type: m.rule.issueType ?? "grammar",
      })),
    };
    cache.set(text, out);
    return json(out);
  } catch {
    return json({ error: "Couldn't reach the grammar checker.", retryable: true }, 503);
  }
}
