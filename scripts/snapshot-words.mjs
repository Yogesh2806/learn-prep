// Build-time snapshot of the curated word pool: IPA, audio and senses for every word.
// The Free Dictionary API was measured at ~20s/request with intermittent 522s, so the app
// uses this as an instant fallback — live sources still win when they answer.
// Run: npm run snapshot:words
import fs from "node:fs";
import { decodeEntities, stripTags } from "./text-utils.mjs";

const src = fs.readFileSync(new URL("../lib/english-data.ts", import.meta.url), "utf8");
const pool = src.match(/WORD_POOL = `([\s\S]*?)`/)[1].split(/\s+/).filter(Boolean);
const UA = { "User-Agent": "LearnPrep/1.0 (personal study app; build snapshot)" };

async function get(url, timeout) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function freeDict(word) {
  for (let i = 0; i < 2; i++) {
    try {
      const data = await get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, 40_000);
      const phon = data.flatMap((e) => e.phonetics ?? []);
      const audio = phon.find((p) => p.audio && /-us\.mp3$/.test(p.audio))?.audio || phon.find((p) => p.audio)?.audio || null;
      const ipa = data.find((e) => e.phonetic)?.phonetic || phon.find((p) => p.text)?.text || null;
      const senses = data.flatMap((e) => e.meanings.flatMap((m) => m.definitions.map((d) => ({ pos: m.partOfSpeech, definition: d.definition, ...(d.example ? { example: d.example } : {}) })))).slice(0, 8);
      return { ipa, audio, senses };
    } catch (e) {
      if (e.message === "404") return null;
    }
  }
  return null;
}

async function wiktionary(word) {
  try {
    const data = await get(`https://en.wiktionary.org/api/rest_v1/page/definition/${word}`, 10_000);
    return (data.en ?? [])
      .flatMap((e) => e.definitions.map((d) => ({ pos: e.partOfSpeech.toLowerCase(), definition: decodeEntities(stripTags(d.definition)).trim() })))
      .filter((s) => s.definition && !/^(plural|alternative|obsolete|archaic) (form|spelling)? ?of/i.test(s.definition))
      .slice(0, 8);
  } catch {
    return [];
  }
}

// Incremental: keep what earlier runs saved and only fetch the gaps (both sources
// rate-limit bursts, so a full refetch just produces new gaps).
const snapPath = new URL("../lib/word-snapshot.json", import.meta.url);
const out = fs.existsSync(snapPath) && process.argv[2] !== "--full" ? JSON.parse(fs.readFileSync(snapPath, "utf8")) : {};
const missing = [];
let done = 0;
async function worker(queue) {
  for (let w; (w = queue.shift()); ) {
    const [fd, wk] = await Promise.all([freeDict(w), wiktionary(w)]);
    // Keep the reviewed everyday sense (scripts/pick-senses.mjs) when it survives the refresh.
    const keep = (senses) => (senses.some((s) => s.definition === out[w]?.primary) ? { primary: out[w].primary } : {});
    if (fd?.senses?.length) out[w] = { ipa: fd.ipa, audio: fd.audio, senses: fd.senses, source: "dictionaryapi.dev", ...keep(fd.senses) };
    else if (wk.length) out[w] = { ipa: fd?.ipa ?? out[w]?.ipa ?? null, audio: fd?.audio ?? out[w]?.audio ?? null, senses: wk, source: "wiktionary", ...keep(wk) };
    else if (!out[w]) missing.push(w);
    await new Promise((r) => setTimeout(r, 400)); // be polite to both free services
    if (++done % 20 === 0) console.log(`${done}/${pool.length}`);
  }
}
const queue = pool.filter((w) => !out[w] || !out[w].ipa);
console.log(`fetching ${queue.length} of ${pool.length} (rest already saved)`);
await Promise.all(Array.from({ length: 3 }, () => worker(queue)));

const ordered = Object.fromEntries(pool.filter((w) => out[w]).map((w) => [w, out[w]]));
fs.writeFileSync(snapPath, JSON.stringify(ordered));
const vals = Object.values(ordered);
console.log(`\n${vals.length}/${pool.length} words | IPA ${vals.filter((v) => v.ipa).length} | audio ${vals.filter((v) => v.audio).length} | from Free Dictionary ${vals.filter((v) => v.source === "dictionaryapi.dev").length}, Wiktionary ${vals.filter((v) => v.source === "wiktionary").length}`);
if (missing.length) console.log("MISSING (remove from pool):", missing.join(", "));
