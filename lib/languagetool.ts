import { fetchJSON } from "./net";

export type LTMatch = {
  offset: number;
  length: number;
  text: string;
  message: string;
  short: string;
  replacements: string[];
  rule: string;
  category: string;
  type: string;
};

export async function checkText(text: string): Promise<LTMatch[]> {
  const res = await fetchJSON<{ matches: LTMatch[] }>("/api/check", {
    timeoutMs: 20_000,
    backoff: [2_000, 5_000],
    init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) },
  });
  return res.matches;
}

/** Apply each match's first suggestion, right-to-left so offsets stay valid. */
export function applyFixes(text: string, matches: LTMatch[]) {
  return [...matches]
    .filter((m) => m.replacements.length)
    .sort((a, b) => b.offset - a.offset)
    .reduce((s, m) => s.slice(0, m.offset) + m.replacements[0] + s.slice(m.offset + m.length), text);
}

/** Split text into plain and flagged runs for underlining the checker's findings. */
export function highlight(text: string, matches: LTMatch[]) {
  const out: { text: string; hit: boolean }[] = [];
  let at = 0;
  for (const m of [...matches].sort((a, b) => a.offset - b.offset)) {
    if (m.offset < at) continue;
    if (m.offset > at) out.push({ text: text.slice(at, m.offset), hit: false });
    out.push({ text: text.slice(m.offset, m.offset + m.length), hit: true });
    at = m.offset + m.length;
  }
  if (at < text.length) out.push({ text: text.slice(at), hit: false });
  return out;
}
