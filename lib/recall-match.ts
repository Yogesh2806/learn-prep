// Free-recall grading, ported from the single-file app where it was tested against all
// 85 Design terms: normalises spacing/punctuation, accepts acronym ↔ expansion,
// tolerates small typos, and still fails confusable pairs (CES ≠ CSAT).

export function norm(s: string) {
  let t = String(s).toLowerCase();
  if (t.normalize) t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return t.replace(/[^a-z0-9]+/g, "");
}
const depluralize = (x: string) => x.replace(/s$/, "");

export function aliases(term: string) {
  const out: string[] = [];
  const add = (x: string) => {
    const n = norm(x);
    if (n && !out.includes(n)) out.push(n);
  };
  add(term);
  const m = term.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (m) {
    add(m[1]);
    add(m[2]);
    m[1].split(/\s*\/\s*/).forEach(add);
  } else {
    const parts = term.split(/\s*\/\s*/);
    if (parts.length > 1 && parts.every((p) => norm(p).length > 0 && norm(p).length <= 5)) parts.forEach(add);
  }
  return out;
}

export function lev(a: string, b: string) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

export type Grade = "exact" | "close" | "wrong" | "empty";

export function grade(input: string, term: string): Grade {
  const a = norm(input);
  if (!a) return "empty";
  const list = aliases(term);
  if (list.some((t) => a === t || depluralize(a) === depluralize(t))) return "exact";
  if (list.some((t) => {
    const tol = t.length <= 4 ? 0 : t.length <= 9 ? 1 : 2;
    return tol > 0 && lev(a, t) <= tol;
  })) return "close";
  return "wrong";
}

/** "North Star Metric" → "N····  S···  M·····" */
export function letterHint(term: string) {
  return term
    .split(/\s+/)
    .map((w) => {
      const core = w.replace(/[^A-Za-z0-9]/g, "");
      return core ? core[0] + "·".repeat(core.length - 1) : w;
    })
    .join("   ");
}
