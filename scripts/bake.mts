// Pre-generates the teaching content that doesn't need to be live, so those screens
// render instantly: Word of the Day lessons and memory hooks for every pool word, the
// Design extras and hooks for every card, and extra examples for all 12 tenses.
//
// It reuses the live tasks' prompts, schemas and validators, batches several items per
// call (free-tier quotas are per request and small), and saves after every batch, so it
// can be stopped and resumed:
//
//   npm run bake            # fill in what's missing
//   npm run bake -- --full  # regenerate everything (e.g. after a PROMPT_VERSION bump)

import { readFileSync, writeFileSync } from "node:fs";
import { PROMPT_VERSION, type AiTask } from "../lib/ai-types";
import { DECK } from "../lib/design-data";
import { TOPIC_LESSONS } from "../lib/english-lessons";
import { bakeKey } from "../lib/server/baked";
import { generate } from "../lib/server/gemini";
import { SYSTEM_INSTRUCTION, TASKS } from "../lib/server/tasks";
import { TENSE_IDS } from "../lib/tense-meta";

type Snap = Record<string, { senses: { pos: string; definition: string }[]; primary?: string }>;

const FILE = new URL("../lib/baked-ai.json", import.meta.url);
const BATCH = 8;
const snapshot = JSON.parse(readFileSync(new URL("../lib/word-snapshot.json", import.meta.url), "utf8")) as Snap;

let store = JSON.parse(readFileSync(FILE, "utf8")) as { version: number; items: Record<string, unknown> };
if (process.argv.includes("--full") || store.version !== PROMPT_VERSION) store = { version: PROMPT_VERSION, items: {} };
const save = () => writeFileSync(FILE, JSON.stringify(store));

// ---------------------------------------------------------------- the jobs
type Job = { task: AiTask; input: unknown; key: string };
const jobs: Job[] = [];
const add = (task: AiTask, raw: unknown) => {
  const input = TASKS[task].parse(raw as never); // exactly what the route would see
  const key = bakeKey(task, input)!;
  if (!(key in store.items) && !jobs.some((j) => j.key === key)) jobs.push({ task, input, key });
};

for (const [word, e] of Object.entries(snapshot)) {
  const sense = e.senses.find((s) => s.definition === e.primary) ?? e.senses[0];
  add("word-teach", { word, senses: [{ pos: sense.pos, definition: sense.definition }] });
  add("mnemonic", { term: word, definition: sense.definition });
}
for (const c of DECK) {
  add("design-extras", { term: c.term, definition: c.def });
  add("mnemonic", { term: c.term, definition: c.def });
}
for (const tense of TENSE_IDS) add("tense-explain", { tense });
for (const [topic, c] of Object.entries(TOPIC_LESSONS)) add("mnemonic", { term: topic, definition: c.rule });

console.log(`${Object.keys(store.items).length} baked already, ${jobs.length} to go`);

// ---------------------------------------------------------------- batching
type Schema = Record<string, unknown>;

async function runBatch(task: AiTask, batch: Job[]) {
  const def = TASKS[task];
  const prompt =
    `Answer each of the ${batch.length} requests below independently, as if each were asked on its own.\n` +
    `Return { "items": [ { "id": <the request id>, "result": <the answer> } ] } with one entry per request.\n\n` +
    batch.map((j, n) => `### Request id ${n}\n${def.prompt(j.input as never)}`).join("\n\n");
  const schema: Schema = {
    type: "OBJECT",
    properties: {
      items: {
        type: "ARRAY",
        items: { type: "OBJECT", properties: { id: { type: "INTEGER" }, result: def.schema }, required: ["id", "result"] },
      },
    },
    required: ["items"],
  };

  let got = 0;
  await generate({
    system: SYSTEM_INSTRUCTION,
    prompt,
    schema,
    tier: "fast",
    temperature: def.temperature,
    timing: { hedgeMs: 45_000, perModelMs: 90_000, budgetMs: 200_000 },
    // Keep every item that passes the task's own validator; the rest retry next pass.
    accept: (raw) => {
      const items = (raw as { items?: { id: number; result: unknown }[] })?.items ?? [];
      for (const { id, result } of items) {
        const job = batch[id];
        if (!job || job.key in store.items) continue;
        const ok = def.check(result as never, job.input as never);
        if (ok) {
          store.items[job.key] = ok;
          got++;
        }
      }
      return got ? true : null;
    },
  });
  return got;
}

const byTask = new Map<AiTask, Job[]>();
for (const j of jobs) byTask.set(j.task, [...(byTask.get(j.task) ?? []), j]);

for (let pass = 1; pass <= 3; pass++) {
  let left = 0;
  for (const [task, list] of byTask) {
    const todo = list.filter((j) => !(j.key in store.items));
    for (let i = 0; i < todo.length; i += BATCH) {
      const batch = todo.slice(i, i + BATCH);
      const t = Date.now();
      try {
        const got = await runBatch(task, batch);
        save();
        console.log(`${task}: +${got}/${batch.length} in ${((Date.now() - t) / 1000).toFixed(1)}s`);
      } catch (e) {
        console.warn(`${task}: batch failed — ${(e as Error).message}`);
        if ((e as { status?: number }).status === 429) await new Promise((r) => setTimeout(r, 20_000));
      }
    }
    left += list.filter((j) => !(j.key in store.items)).length;
  }
  if (!left) break;
  console.log(`pass ${pass} done, ${left} still missing`);
}

const missing = jobs.filter((j) => !(j.key in store.items));
console.log(`${Object.keys(store.items).length} baked in total${missing.length ? `, ${missing.length} missing (run again later)` : ""}`);
