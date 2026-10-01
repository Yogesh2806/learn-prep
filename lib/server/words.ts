import "server-only";
import type { Sense } from "../ai-types";
import snapshotJson from "../word-snapshot.json";

/** curated: senses[0] is the reviewed everyday sense (scripts/pick-senses.mjs), so no model has to choose. */
export type WordEntry = { word: string; ipa: string | null; audio: string | null; senses: Sense[]; synonyms: string[]; sources: string[]; curated: boolean };
type Snap = { ipa: string | null; audio: string | null; senses: Sense[]; source: string; primary?: string };
const SNAPSHOT = snapshotJson as Record<string, Snap>;
const UA = { "User-Agent": "LearnPrep/1.0 (study app)" };

// Wiktionary inlines <style> blocks (e.g. ".mw-parser-output .defdate{…}"): drop them with their text.
const stripTags = (s: string) =>
  s.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, "").replace(/\.mw-parser-output[^}]*\}/g, "").replace(/\s+([,.;:])/g, "$1").replace(/\s{2,}/g, " ").replace(/^[\s:]+/, "");
const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

type FD = { ipa: string | null; audio: string | null; senses: Sense[]; synonyms: string[] };

export async function freeDictionary(word: string, timeout: number): Promise<FD | null> {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { headers: UA, signal: AbortSignal.timeout(timeout), cache: "no-store" });
  if (!res.ok) return null;
  type E = { phonetic?: string; phonetics?: { text?: string; audio?: string }[]; meanings: { partOfSpeech: string; synonyms?: string[]; definitions: { definition: string; example?: string; synonyms?: string[] }[] }[] };
  const data = (await res.json()) as E[];
  const phon = data.flatMap((e) => e.phonetics ?? []);
  const audio = phon.find((p) => p.audio && /-us\.mp3$/.test(p.audio))?.audio || phon.find((p) => p.audio)?.audio || null;
  const syn = new Set<string>();
  const senses: Sense[] = [];
  for (const e of data)
    for (const m of e.meanings) {
      m.synonyms?.forEach((s) => syn.add(s));
      for (const d of m.definitions) {
        d.synonyms?.forEach((s) => syn.add(s));
        if (senses.length < 8) senses.push({ pos: m.partOfSpeech, definition: d.definition, ...(d.example ? { example: d.example } : {}) });
      }
    }
  return {
    ipa: data.find((e) => e.phonetic)?.phonetic || phon.find((p) => p.text)?.text || null,
    audio: audio ? audio.replace(/^\/\//, "https://") : null,
    senses,
    synonyms: [...syn].filter((s) => !s.includes(" ")).slice(0, 8),
  };
}

export async function wiktionary(word: string, timeout: number): Promise<Sense[]> {
  const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, { headers: UA, signal: AbortSignal.timeout(timeout), cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { en?: { partOfSpeech: string; definitions: { definition: string; examples?: string[] }[] }[] };
  return (data.en ?? [])
    .flatMap((e) =>
      e.definitions.map((d) => {
        const ex = d.examples?.map((x) => decode(stripTags(x)).trim()).find((x) => x.length > 10 && x.length < 200);
        return { pos: e.partOfSpeech.toLowerCase(), definition: decode(stripTags(d.definition)).trim(), ...(ex ? { example: ex } : {}) };
      }),
    )
    .filter((s) => s.definition && !/^(plural|alternative|obsolete|archaic|misspelling)\b.*\bof\b/i.test(s.definition))
    .slice(0, 8);
}

export const hasSnapshot = (word: string) => !!SNAPSHOT[word]?.senses.length;

/** Merge whatever answered. Senses prefer the Free Dictionary, then Wiktionary, then the snapshot. */
export function merge(word: string, fd: FD | null, wk: Sense[]): WordEntry | null {
  const snap = SNAPSHOT[word];
  const sources: string[] = [];
  let senses: Sense[] = [];
  if (fd?.senses.length) {
    senses = fd.senses;
    sources.push("Free Dictionary API");
  } else if (wk.length) {
    senses = wk;
    sources.push("Wiktionary");
  } else if (snap?.senses.length) {
    senses = snap.senses;
    sources.push(snap.source === "wiktionary" ? "Wiktionary (saved copy)" : "Free Dictionary API (saved copy)");
  }
  if (!senses.length) return null;

  // Lead with the reviewed everyday sense. Live sources sometimes lack it entirely (the
  // Free Dictionary returns only the verb "compel" for "compelling"), so borrow it back.
  let curated = false;
  const primary = snap?.primary && snap.senses.find((s) => s.definition === snap.primary);
  if (primary) {
    const norm = (t: string) => t.toLowerCase().replace(/[^a-z]/g, "");
    const i = senses.findIndex((s) => norm(s.definition) === norm(primary.definition));
    senses = i >= 0 ? [senses[i], ...senses.filter((_, j) => j !== i)] : [primary, ...senses];
    curated = true;
  }
  return {
    word,
    ipa: fd?.ipa ?? snap?.ipa ?? null,
    audio: fd?.audio ?? snap?.audio ?? null,
    senses,
    synonyms: fd?.synonyms ?? [],
    sources,
    curated,
  };
}
