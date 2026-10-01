import { KEYS, readJSON, writeJSON } from "./storage";

// Writing Arena content. Rewrite challenges are hand-written awkward sentences — each
// with one clear thing wrong — at two levels; the arena moves you up once your recent
// scores are consistently high (adaptive difficulty from the PRD).

export type Level = "intermediate" | "advanced";
export type Challenge = { id: string; text: string; level: Level; focus: string };

export const CHALLENGES: Challenge[] = [
  // ---------------------------------------------------------------- intermediate
  { id: "i1", level: "intermediate", focus: "wordiness", text: "The reason why the launch was delayed was because of the fact that testing wasn't finished." },
  { id: "i2", level: "intermediate", focus: "redundancy", text: "In my personal opinion, I think that we should repeat the survey again next month." },
  { id: "i3", level: "intermediate", focus: "passive voice", text: "A decision was made by the committee to postpone the event until a later date in the future." },
  { id: "i4", level: "intermediate", focus: "filler words", text: "Basically, the new app is actually really very easy to use for literally anyone." },
  { id: "i5", level: "intermediate", focus: "word order", text: "Yesterday to the market with my sister I went and some vegetables we bought." },
  { id: "i6", level: "intermediate", focus: "run-on sentence", text: "The train was late and the platform was crowded and it was raining so we decided to get a taxi instead." },
  { id: "i7", level: "intermediate", focus: "vague words", text: "The movie was good and the actors were nice and the ending was kind of interesting stuff." },
  { id: "i8", level: "intermediate", focus: "tense consistency", text: "She walks into the room, looked around, and then she sits down without saying anything." },
  { id: "i9", level: "intermediate", focus: "nominalisation", text: "We had a discussion about the implementation of the changes and came to an agreement." },
  { id: "i10", level: "intermediate", focus: "double negative", text: "I don't have no time to do nothing else this week." },
  { id: "i11", level: "intermediate", focus: "subject–verb agreement", text: "The list of things we need to buy for the trip are getting longer every day." },
  { id: "i12", level: "intermediate", focus: "repetition", text: "The phone is a great phone because the phone's camera is better than other phones." },
  { id: "i13", level: "intermediate", focus: "unclear pronoun", text: "When Priya called Anjali, she said she was running late for her meeting." },
  { id: "i14", level: "intermediate", focus: "hedging", text: "I was just wondering if maybe you might possibly be able to send the file at some point?" },
  // ---------------------------------------------------------------- advanced
  { id: "a1", level: "advanced", focus: "dangling modifier", text: "Having finished the report late at night, the coffee machine was the only thing still working." },
  { id: "a2", level: "advanced", focus: "parallel structure", text: "The new role involves managing a team, to plan budgets, and the presentation of results to clients." },
  { id: "a3", level: "advanced", focus: "buried main point", text: "Although there were several factors, including weather and staffing, which were discussed at length, the match is cancelled." },
  { id: "a4", level: "advanced", focus: "stacked nouns", text: "The customer satisfaction survey response rate improvement plan review meeting is on Friday." },
  { id: "a5", level: "advanced", focus: "weak verbs", text: "There are many people who are of the opinion that there is a need for better public transport." },
  { id: "a6", level: "advanced", focus: "misplaced modifier", text: "She almost drove her kids to school every day last year, except during the holidays." },
  { id: "a7", level: "advanced", focus: "comma splice", text: "The documentary was fascinating, it showed how cities grew around rivers, I watched it twice." },
  { id: "a8", level: "advanced", focus: "jargon", text: "We need to leverage our synergies going forward to move the needle on key deliverables." },
  { id: "a9", level: "advanced", focus: "mixed construction", text: "By working longer hours is not the best way to finish the project faster." },
  { id: "a10", level: "advanced", focus: "faulty comparison", text: "The food at the new café is much better than the old café on our street." },
  { id: "a11", level: "advanced", focus: "overlong sentence", text: "Due to the fact that the meeting, which had been scheduled for Monday, was moved because several people, including the director, were travelling, we will now meet on Thursday instead." },
  { id: "a12", level: "advanced", focus: "tone", text: "As per my last email, which you clearly didn't read, the deadline is obviously Friday." },
];

export const PROMPTS = [
  "Describe your ideal weekend in three or four sentences.",
  "Write a short message asking a friend to reschedule dinner.",
  "Explain your favourite film to someone who hasn't seen it — no spoilers.",
  "Write a polite note to a neighbour about loud music late at night.",
  "Describe a place from your childhood that you still think about.",
  "Write a short review of the last meal you really enjoyed.",
  "Explain how to make your favourite drink, step by step.",
  "Write a message congratulating a colleague on a promotion.",
  "Describe a habit you'd like to build and why.",
  "Write a short story opening that starts with a phone ringing at 3 a.m.",
];

// ---------------------------------------------------------------- progress
export type WritingProgress = { scores: { id: string; score: number }[] };
export const loadWriting = () => readJSON<WritingProgress>(KEYS.writing, { scores: [] });

export function saveScore(p: WritingProgress, id: string, score: number): WritingProgress {
  const next = { scores: [...p.scores, { id, score }].slice(-50) };
  writeJSON(KEYS.writing, next);
  return next;
}

/** Advanced once the last three challenge scores average 80+. */
export function currentLevel(p: WritingProgress): Level {
  const recent = p.scores.filter((s) => !s.id.startsWith("free")).slice(-3);
  return recent.length === 3 && recent.reduce((a, s) => a + s.score, 0) / 3 >= 80 ? "advanced" : "intermediate";
}

/** Next challenge at your level, preferring ones you haven't tried. */
export function nextChallenge(p: WritingProgress, level: Level, skip?: string): Challenge {
  const tried = new Set(p.scores.map((s) => s.id));
  const pool = CHALLENGES.filter((c) => c.level === level && c.id !== skip);
  const fresh = pool.filter((c) => !tried.has(c.id));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}
