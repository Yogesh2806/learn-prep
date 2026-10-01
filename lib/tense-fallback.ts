import type { TenseDrill } from "./ai-types";

// Offline drills: one per tense, used only when the teaching layer can't be reached.
// Hand-checked; labelled in the UI as saved drills rather than fresh ones.

export const FALLBACK_DRILLS: TenseDrill[] = [
  { sentence: "We ___ the contract last Tuesday.", verb: "sign", options: ["signed", "have signed", "were signing"], answer: 0, tense: "past-simple", why: "“Last Tuesday” is a finished, stated past time, so the past simple fits." },
  { sentence: "I ___ dinner when the power went out.", verb: "cook", options: ["cooked", "was cooking", "had cooked"], answer: 1, tense: "past-continuous", why: "An action in progress that another past event interrupted takes the past continuous." },
  { sentence: "By the time we reached the station, the train ___.", verb: "leave", options: ["left", "has left", "had left"], answer: 2, tense: "past-perfect", why: "The train leaving happened before another past moment — that earlier past is the past perfect." },
  { sentence: "She ___ for three hours when the rescue team found her.", verb: "walk", options: ["had been walking", "was walking", "has walked"], answer: 0, tense: "past-perfect-continuous", why: "“For three hours … when” stresses how long something ran up to a past moment." },
  { sentence: "He ___ to the gym every morning before work.", verb: "go", options: ["is going", "goes", "has gone"], answer: 1, tense: "present-simple", why: "“Every morning” marks a habit, and habits take the present simple." },
  { sentence: "Please keep it down — the baby ___.", verb: "sleep", options: ["sleeps", "has slept", "is sleeping"], answer: 2, tense: "present-continuous", why: "It's happening right now, so the present continuous fits." },
  { sentence: "I ___ my keys, so I can't get into the flat.", verb: "lose", options: ["have lost", "lost", "was losing"], answer: 0, tense: "present-perfect", why: "A past action with a result you feel now, and no time given, is the present perfect." },
  { sentence: "They ___ that bridge since 2021 and it still isn't finished.", verb: "build", options: ["built", "have been building", "are building"], answer: 1, tense: "present-perfect-continuous", why: "“Since 2021 … still” — started in the past and still going, stressing duration." },
  { sentence: "It's cold in here — I ___ the window.", verb: "close", options: ["will close", "am closing", "close"], answer: 0, tense: "future-simple", why: "A decision made at the moment of speaking takes “will”." },
  { sentence: "Don't call at eight — we ___ dinner then.", verb: "have", options: ["will have", "will be having", "will have had"], answer: 1, tense: "future-continuous", why: "An action in progress at a specific future moment is the future continuous." },
  { sentence: "By the end of the year, I ___ the whole course.", verb: "finish", options: ["will finish", "will be finishing", "will have finished"], answer: 2, tense: "future-perfect", why: "“By the end of the year” points to something completed before a future moment." },
  { sentence: "Next month she ___ at the company for a decade.", verb: "work", options: ["will have been working", "will work", "works"], answer: 0, tense: "future-perfect-continuous", why: "Duration up to a future moment — “for a decade” by next month — takes the future perfect continuous." },
];
