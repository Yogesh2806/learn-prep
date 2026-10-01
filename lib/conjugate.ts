import nlp from "compromise";
import { ASPECTS, TIMES, type TenseId } from "./tense-meta";

// Builds all 12 tense forms for any verb, offline. compromise handles regular verbs; this
// table is authoritative for irregulars because compromise was measured getting 9 of 91
// common irregular participles wrong (e.g. "had ran", "had came", "been" → "was").

const IRREGULAR: Record<string, [past: string, participle: string]> = {
  arise: ["arose", "arisen"], awake: ["awoke", "awoken"], be: ["was", "been"], bear: ["bore", "borne"], beat: ["beat", "beaten"],
  become: ["became", "become"], begin: ["began", "begun"], bend: ["bent", "bent"], bet: ["bet", "bet"], bind: ["bound", "bound"],
  bite: ["bit", "bitten"], bleed: ["bled", "bled"], blow: ["blew", "blown"], break: ["broke", "broken"], breed: ["bred", "bred"],
  bring: ["brought", "brought"], broadcast: ["broadcast", "broadcast"], build: ["built", "built"], burst: ["burst", "burst"],
  buy: ["bought", "bought"], catch: ["caught", "caught"], choose: ["chose", "chosen"], cling: ["clung", "clung"], come: ["came", "come"],
  cost: ["cost", "cost"], creep: ["crept", "crept"], cut: ["cut", "cut"], deal: ["dealt", "dealt"], dig: ["dug", "dug"],
  do: ["did", "done"], draw: ["drew", "drawn"], drink: ["drank", "drunk"], drive: ["drove", "driven"], eat: ["ate", "eaten"],
  fall: ["fell", "fallen"], feed: ["fed", "fed"], feel: ["felt", "felt"], fight: ["fought", "fought"], find: ["found", "found"],
  flee: ["fled", "fled"], fling: ["flung", "flung"], fly: ["flew", "flown"], forbid: ["forbade", "forbidden"], forecast: ["forecast", "forecast"],
  forget: ["forgot", "forgotten"], forgive: ["forgave", "forgiven"], freeze: ["froze", "frozen"], get: ["got", "gotten"], give: ["gave", "given"],
  go: ["went", "gone"], grind: ["ground", "ground"], grow: ["grew", "grown"], hang: ["hung", "hung"], have: ["had", "had"],
  hear: ["heard", "heard"], hide: ["hid", "hidden"], hit: ["hit", "hit"], hold: ["held", "held"], hurt: ["hurt", "hurt"],
  keep: ["kept", "kept"], kneel: ["knelt", "knelt"], know: ["knew", "known"], lay: ["laid", "laid"], lead: ["led", "led"],
  leave: ["left", "left"], lend: ["lent", "lent"], let: ["let", "let"], lie: ["lay", "lain"], light: ["lit", "lit"],
  lose: ["lost", "lost"], make: ["made", "made"], mean: ["meant", "meant"], meet: ["met", "met"], mislead: ["misled", "misled"],
  mistake: ["mistook", "mistaken"], overcome: ["overcame", "overcome"], overtake: ["overtook", "overtaken"], pay: ["paid", "paid"],
  prove: ["proved", "proven"], put: ["put", "put"], quit: ["quit", "quit"], read: ["read", "read"], rid: ["rid", "rid"],
  ride: ["rode", "ridden"], ring: ["rang", "rung"], rise: ["rose", "risen"], run: ["ran", "run"], say: ["said", "said"],
  see: ["saw", "seen"], seek: ["sought", "sought"], sell: ["sold", "sold"], send: ["sent", "sent"], set: ["set", "set"],
  sew: ["sewed", "sewn"], shake: ["shook", "shaken"], shed: ["shed", "shed"], shine: ["shone", "shone"], shoot: ["shot", "shot"],
  show: ["showed", "shown"], shrink: ["shrank", "shrunk"], shut: ["shut", "shut"], sing: ["sang", "sung"], sink: ["sank", "sunk"],
  sit: ["sat", "sat"], sleep: ["slept", "slept"], slide: ["slid", "slid"], speak: ["spoke", "spoken"], speed: ["sped", "sped"],
  spend: ["spent", "spent"], spin: ["spun", "spun"], split: ["split", "split"], spread: ["spread", "spread"], spring: ["sprang", "sprung"],
  stand: ["stood", "stood"], steal: ["stole", "stolen"], stick: ["stuck", "stuck"], sting: ["stung", "stung"], stink: ["stank", "stunk"],
  strike: ["struck", "struck"], swear: ["swore", "sworn"], sweep: ["swept", "swept"], swim: ["swam", "swum"], swing: ["swung", "swung"],
  take: ["took", "taken"], teach: ["taught", "taught"], tear: ["tore", "torn"], tell: ["told", "told"], think: ["thought", "thought"],
  throw: ["threw", "thrown"], understand: ["understood", "understood"], undertake: ["undertook", "undertaken"], upset: ["upset", "upset"],
  wake: ["woke", "woken"], wear: ["wore", "worn"], weave: ["wove", "woven"], weep: ["wept", "wept"], win: ["won", "won"],
  withdraw: ["withdrew", "withdrawn"], write: ["wrote", "written"],
};

/** Verbs with two meanings and two conjugations — surfaced as a note, not guessed. */
export const VERB_NOTES: Record<string, string> = {
  lie: "Lie = recline: lay / lain. Lie = say something untrue is regular: lied / lied.",
  hang: "Hang a picture: hung / hung. For executions, formal English uses hanged / hanged.",
  get: "American English uses gotten; British English usually has got.",
  prove: "Both proved and proven are correct as the participle.",
};

export const SUBJECTS = [
  { id: "I", label: "I" },
  { id: "you", label: "you" },
  { id: "she", label: "she / he / it" },
  { id: "we", label: "we" },
  { id: "they", label: "they" },
] as const;
export type Subject = (typeof SUBJECTS)[number]["id"];

export type VerbForms = { base: string; third: string; past: string; participle: string; gerund: string; known: boolean };

export function verbForms(input: string): VerbForms | null {
  const base = input.trim().toLowerCase().replace(/^to\s+/, "");
  if (!/^[a-z]+(-[a-z]+)?$/.test(base)) return null;

  // "be" and "have" are fully irregular in the present too.
  if (base === "be") return { base, third: "is", past: "was", participle: "been", gerund: "being", known: true };

  const doc = nlp(base);
  let c = doc.verbs().conjugate()[0] as Record<string, string> | undefined;
  const recognised = !!c;
  // .tag() is typed as a plain View, but it returns the same document (verified at runtime).
  if (!c) c = (nlp(base).tag("Verb") as ReturnType<typeof nlp>).verbs().conjugate()[0] as Record<string, string> | undefined;
  if (!c) return null;

  const irr = IRREGULAR[base];
  const past = irr?.[0] ?? c.PastTense ?? base + "ed";
  return {
    base,
    third: c.PresentTense ?? base + "s",
    past,
    participle: irr?.[1] ?? c.Participle ?? past,
    gerund: c.Gerund ?? base + "ing",
    known: recognised || !!irr,
  };
}

function be(time: "past" | "present", s: Subject) {
  if (time === "present") return s === "I" ? "am" : s === "she" ? "is" : "are";
  return s === "I" || s === "she" ? "was" : "were";
}
const has = (s: Subject) => (s === "she" ? "has" : "have");

/** The verb phrase for one tense, e.g. ("go", "present-perfect", "she") → "has gone". */
export function formFor(f: VerbForms, tense: TenseId, s: Subject): string {
  const [time, ...rest] = tense.split("-");
  const aspect = rest.join("-");
  const pastBe = f.base === "be" ? be("past", s) : f.past;
  switch (`${time}-${aspect}`) {
    case "past-simple": return pastBe;
    case "past-continuous": return `${be("past", s)} ${f.gerund}`;
    case "past-perfect": return `had ${f.participle}`;
    case "past-perfect-continuous": return `had been ${f.gerund}`;
    case "present-simple": return f.base === "be" ? be("present", s) : s === "she" ? f.third : f.base;
    case "present-continuous": return `${be("present", s)} ${f.gerund}`;
    case "present-perfect": return `${has(s)} ${f.participle}`;
    case "present-perfect-continuous": return `${has(s)} been ${f.gerund}`;
    case "future-simple": return `will ${f.base}`;
    case "future-continuous": return `will be ${f.gerund}`;
    case "future-perfect": return `will have ${f.participle}`;
    default: return `will have been ${f.gerund}`;
  }
}

export function allForms(f: VerbForms, s: Subject) {
  return Object.fromEntries(TIMES.flatMap((t) => ASPECTS.map((a) => [`${t}-${a}`, formFor(f, `${t}-${a}` as TenseId, s)]))) as Record<TenseId, string>;
}
