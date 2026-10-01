import { PROMPT_VERSION } from "@/lib/ai-types";
import { baked } from "@/lib/server/baked";

// GET /api/baked?v=<PROMPT_VERSION>&k=<bake key>  →  the pre-generated answer, or 404.
// The server makes no model calls at all: live AI runs in the learner's browser, on the
// engine they chose in Settings. These answers never change within a version, so the
// CDN can keep them.

export function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("k") ?? "";
  if (url.searchParams.get("v") !== String(PROMPT_VERSION) || key.length > 200) {
    return Response.json({ error: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const data = baked(key);
  if (!data) return Response.json({ error: "Not baked." }, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  return Response.json({ data }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" } });
}
