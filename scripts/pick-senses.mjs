// Picks the everyday sense of every pool word, once, and stores it in the snapshot as
// `primary` (the definition text). Dictionaries order senses inconsistently — the saved
// copy of "pragmatic" leads with the archaic noun "A man of business" — so this choice is
// made ahead of time and reviewed, instead of by a live model call on every card.
//
//   node --env-file=.env.local scripts/pick-senses.mjs          # only words without one
//   node --env-file=.env.local scripts/pick-senses.mjs --full   # redo all

import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../lib/word-snapshot.json", import.meta.url);
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error("GEMINI_API_KEY missing — run with --env-file=.env.local");
const MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const BATCH = 12;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const snap = JSON.parse(readFileSync(FILE, "utf8"));
const full = process.argv.includes("--full");
const todo = Object.keys(snap).filter((w) => snap[w].senses.length && (full || !snap[w].primary));
console.log(`picking senses for ${todo.length} words`);

const schema = {
  type: "ARRAY",
  items: { type: "OBJECT", properties: { word: { type: "STRING" }, sense: { type: "INTEGER" } }, required: ["word", "sense"] },
};

async function ask(words) {
  const prompt =
    "For each word, return the index of the sense an ordinary adult most likely means when they hear it today " +
    "in news, TV, podcasts or conversation. Skip archaic, obsolete, technical and rare senses.\n\n" +
    words.map((w) => `${w}:\n` + snap[w].senses.map((s, i) => `  ${i}. (${s.pos}) ${s.definition}`).join("\n")).join("\n\n");
  for (let round = 0; round < 3; round++) {
    for (const model of MODELS) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
        }),
        signal: AbortSignal.timeout(40_000),
      }).catch(() => null);
      if (!res?.ok) {
        console.warn(`  ${model} → ${res?.status ?? "no answer"}`);
        continue;
      }
      const body = await res.json();
      const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
      try {
        return JSON.parse(text);
      } catch {
        console.warn(`  ${model} → unparseable`);
      }
    }
    await sleep(5_000 * (round + 1));
  }
  throw new Error("all models failed");
}

for (let i = 0; i < todo.length; i += BATCH) {
  const words = todo.slice(i, i + BATCH);
  const picks = await ask(words);
  for (const { word, sense } of picks) {
    const e = snap[word];
    if (e && Number.isInteger(sense) && e.senses[sense]) e.primary = e.senses[sense].definition;
  }
  writeFileSync(FILE, JSON.stringify(snap));
  console.log(`${Math.min(i + BATCH, todo.length)}/${todo.length}`);
}
const missing = Object.keys(snap).filter((w) => !snap[w].primary);
console.log(missing.length ? `no pick for: ${missing.join(", ")}` : "every word has a primary sense");
