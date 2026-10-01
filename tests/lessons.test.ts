import { TOPIC_LESSONS } from "../lib/english-lessons";
import { TENSE_LESSONS } from "../lib/tense-meta";
let bad = 0;
for (const [t, c] of Object.entries(TOPIC_LESSONS)) {
  const p = c.practice;
  if (p.options.length !== 3 || new Set(p.options).size !== 3 || !(p.answer >= 0 && p.answer < 3)) { bad++; console.log("bad mcq", t); }
  if (c.examples.length !== 2 || c.mistake.wrong === c.mistake.right) { bad++; console.log("bad card", t); }
}
for (const [t, l] of Object.entries(TENSE_LESSONS)) if (l.uses.length < 2 || !l.signals.length) { bad++; console.log("bad tense", t); }
console.log(Object.keys(TOPIC_LESSONS).length, "topics,", Object.keys(TENSE_LESSONS).length, "tenses,", bad, "problems");

import { PUNCT_FALLBACK } from "../lib/english-lessons";
const letters = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
let punctBad = 0;
for (const [t, items] of Object.entries(PUNCT_FALLBACK))
  for (const x of items) if (x.broken === x.fixed || letters(x.broken) !== letters(x.fixed)) { punctBad++; console.log("bad punct item", t, x.broken); }
console.log(Object.values(PUNCT_FALLBACK).flat().length, "punctuation items,", punctBad, "problems");
if (bad || punctBad) process.exit(1);
