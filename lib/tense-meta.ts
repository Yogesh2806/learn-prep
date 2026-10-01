// The 12 tenses as a fixed skeleton: names, formulas and one-line meanings are curated
// facts (like the Design deck's definitions). Deeper teaching is generated per tense.

export const TIMES = ["past", "present", "future"] as const;
export const ASPECTS = ["simple", "continuous", "perfect", "perfect-continuous"] as const;
export type Time = (typeof TIMES)[number];
export type Aspect = (typeof ASPECTS)[number];
export type TenseId = `${Time}-${Aspect}`;

export const TENSE_IDS = TIMES.flatMap((t) => ASPECTS.map((a) => `${t}-${a}` as TenseId));

export const TIME_LABEL: Record<Time, string> = { past: "Past", present: "Present", future: "Future" };

export const ASPECT_INFO: Record<Aspect, { label: string; short: string; meaning: string }> = {
  simple: { label: "Simple", short: "Simple", meaning: "The whole action, as a fact." },
  continuous: { label: "Continuous", short: "Cont.", meaning: "In the middle of it — unfinished." },
  perfect: { label: "Perfect", short: "Perfect", meaning: "Done before a point, and it still matters there." },
  "perfect-continuous": { label: "Perfect continuous", short: "Perf. cont.", meaning: "Running up to a point — how long is the story." },
};

export type TenseInfo = { id: TenseId; time: Time; aspect: Aspect; name: string; formula: string; example: string; meaning: string };

const TABLE: Record<TenseId, Omit<TenseInfo, "id" | "time" | "aspect" | "name">> = {
  "past-simple": { formula: "past form (did)", example: "I went to Tokyo in 2019.", meaning: "A finished action at a known past time." },
  "past-continuous": { formula: "was/were + -ing", example: "I was driving home when she called.", meaning: "In progress at a past moment, often interrupted." },
  "past-perfect": { formula: "had + past participle", example: "The film had started before we arrived.", meaning: "Finished before another past moment." },
  "past-perfect-continuous": { formula: "had been + -ing", example: "I'd been waiting an hour when he showed up.", meaning: "Going on up to a past moment — stresses how long." },
  "present-simple": { formula: "base / -s form (does)", example: "She runs every morning.", meaning: "Habits, routines, things that are always true." },
  "present-continuous": { formula: "am/is/are + -ing", example: "I'm writing the report now.", meaning: "Happening right now, or a temporary plan." },
  "present-perfect": { formula: "have/has + past participle", example: "I've read the brief twice.", meaning: "A past action that matters now. No time given." },
  "present-perfect-continuous": { formula: "have/has been + -ing", example: "I've been learning Spanish for a year.", meaning: "Started before now and still going." },
  "future-simple": { formula: "will + base", example: "I'll call you tonight.", meaning: "A decision made now, or a prediction." },
  "future-continuous": { formula: "will be + -ing", example: "This time tomorrow I'll be flying.", meaning: "In progress at a future moment." },
  "future-perfect": { formula: "will have + past participle", example: "By June I'll have finished.", meaning: "Done before a future moment." },
  "future-perfect-continuous": { formula: "will have been + -ing", example: "By June I'll have been here two years.", meaning: "Going on up to a future moment — how long." },
};

export const TENSES: TenseInfo[] = TENSE_IDS.map((id) => {
  const [time, ...rest] = id.split("-") as [Time, ...string[]];
  const aspect = rest.join("-") as Aspect;
  return { id, time, aspect, name: `${TIME_LABEL[time]} ${ASPECT_INFO[aspect].label.toLowerCase()}`, ...TABLE[id] };
});

export const TENSE_BY_ID = Object.fromEntries(TENSES.map((t) => [t.id, t])) as Record<TenseId, TenseInfo>;

export function isTenseId(x: unknown): x is TenseId {
  return typeof x === "string" && (TENSE_IDS as string[]).includes(x);
}

// The core lesson for each tense is curated too, so "how it works" never depends on the
// model being up. The AI adds fresh examples on top (see TenseDetail).
export type TenseLesson = {
  uses: { label: string; example: string }[];
  signals: string[];
  mistake: { wrong: string; right: string; why: string };
};

export const TENSE_LESSONS: Record<TenseId, TenseLesson> = {
  "past-simple": {
    uses: [
      { label: "A finished action at a stated time", example: "We moved to Pune in 2021." },
      { label: "A sequence of past events", example: "She logged in, checked the numbers and left." },
      { label: "Past habits that have stopped", example: "He walked to school every day as a kid." },
    ],
    signals: ["yesterday", "last week", "in 2019", "ago", "when I was…"],
    mistake: { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", why: "A finished time like “yesterday” takes the past simple, not have + participle." },
  },
  "past-continuous": {
    uses: [
      { label: "In progress at a past moment", example: "At 9 p.m. I was cooking dinner." },
      { label: "The background to a short interruption", example: "I was driving home when she called." },
      { label: "Two actions running side by side", example: "While he was talking, everyone was checking their phones." },
    ],
    signals: ["while", "when", "at 8 last night", "all evening"],
    mistake: { wrong: "I was knowing the answer.", right: "I knew the answer.", why: "State verbs such as know, want and believe describe states, not activities, so they rarely take -ing." },
  },
  "past-perfect": {
    uses: [
      { label: "The earlier of two past events", example: "The film had started before we arrived." },
      { label: "Background and reasons in a story", example: "She was exhausted because she hadn't slept." },
      { label: "Regrets with “I wish” and “if only”", example: "I wish I had called her back." },
    ],
    signals: ["before", "after", "by the time", "already", "never… before"],
    mistake: { wrong: "When we arrived, the film started.", right: "When we arrived, the film had started.", why: "Without “had”, the film starts as you walk in. “Had started” means it began earlier and you missed the opening." },
  },
  "past-perfect-continuous": {
    uses: [
      { label: "How long, up to a past moment", example: "I'd been waiting an hour when he showed up." },
      { label: "Explaining a past result", example: "Her eyes were red — she had been crying." },
    ],
    signals: ["for", "since", "how long", "all day", "by the time"],
    mistake: { wrong: "I was waiting for two hours when the bus came.", right: "I had been waiting for two hours when the bus came.", why: "When you measure how long something ran up to a past moment, use had been + -ing." },
  },
  "present-simple": {
    uses: [
      { label: "Habits and routines", example: "She runs every morning." },
      { label: "Facts that are always true", example: "Water boils at 100°C." },
      { label: "Timetables and schedules", example: "The train leaves at 6:40." },
    ],
    signals: ["always", "usually", "every day", "often", "never"],
    mistake: { wrong: "He go to the gym on Mondays.", right: "He goes to the gym on Mondays.", why: "With he, she and it, the present simple adds -s or -es." },
  },
  "present-continuous": {
    uses: [
      { label: "Happening right now", example: "I'm writing the report now." },
      { label: "A temporary situation", example: "He's staying with friends this month." },
      { label: "A fixed plan for the near future", example: "We're meeting the client on Friday." },
    ],
    signals: ["now", "right now", "at the moment", "this week", "currently"],
    mistake: { wrong: "I am wanting a coffee.", right: "I want a coffee.", why: "State verbs (want, know, like, believe) usually stay simple even when you mean right now." },
  },
  "present-perfect": {
    uses: [
      { label: "A past action whose result matters now", example: "I've lost my keys, so I can't get in." },
      { label: "Life experience, no time given", example: "Have you ever been to Japan?" },
      { label: "A time period that isn't over", example: "I've had three coffees today." },
    ],
    signals: ["ever", "never", "already", "yet", "just", "so far", "since", "for"],
    mistake: { wrong: "I live here since 2020.", right: "I have lived here since 2020.", why: "For something that began in the past and is still true, use have/has + participle with since or for." },
  },
  "present-perfect-continuous": {
    uses: [
      { label: "Started in the past and still going", example: "I've been learning Spanish for a year." },
      { label: "Recent activity with visible effects", example: "You're out of breath — have you been running?" },
    ],
    signals: ["for", "since", "how long", "all day", "lately", "recently"],
    mistake: { wrong: "I am waiting here for an hour.", right: "I have been waiting here for an hour.", why: "“For an hour” measures time up to now, which the present continuous can't do." },
  },
  "future-simple": {
    uses: [
      { label: "A decision made on the spot", example: "It's cold — I'll close the window." },
      { label: "Predictions and opinions", example: "I think it will rain later." },
      { label: "Promises and offers", example: "I'll send it to you tonight." },
    ],
    signals: ["tomorrow", "next week", "I think", "probably", "soon"],
    mistake: { wrong: "I will call you when I will arrive.", right: "I will call you when I arrive.", why: "After when, before, after, as soon as and if, English uses the present tense to talk about the future." },
  },
  "future-continuous": {
    uses: [
      { label: "In progress at a future moment", example: "This time tomorrow I'll be flying to Delhi." },
      { label: "Politely asking about plans", example: "Will you be using the car tonight?" },
    ],
    signals: ["this time tomorrow", "at 8 tonight", "all evening"],
    mistake: { wrong: "At ten tomorrow I will work.", right: "At ten tomorrow I will be working.", why: "For an action already under way at a future moment, use will be + -ing." },
  },
  "future-perfect": {
    uses: [
      { label: "Done before a future deadline", example: "By June I'll have finished the course." },
      { label: "Looking back from a point in the future", example: "By the time you read this, I'll have left." },
    ],
    signals: ["by", "by the time", "before", "by then"],
    mistake: { wrong: "By next year I will have finish the course.", right: "By next year I will have finished the course.", why: "After “will have”, use the past participle (finished), not the base verb." },
  },
  "future-perfect-continuous": {
    uses: [
      { label: "How long, up to a future moment", example: "By June I'll have been working here two years." },
      { label: "The reason for a future state", example: "She'll be exhausted — she'll have been driving all day." },
    ],
    signals: ["for… by", "by the time", "how long"],
    mistake: { wrong: "By 2027 I will be living here for ten years.", right: "By 2027 I will have been living here for ten years.", why: "To measure duration up to a future point, use will have been + -ing." },
  },
};
