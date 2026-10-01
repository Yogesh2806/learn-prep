import { allForms, formFor, verbForms } from "../lib/conjugate";

let fails = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  if (got !== want) { fails++; console.log(`FAIL ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};

// Same truth table that exposed compromise's gaps.
const truth: Record<string, string> = {be:'been',become:'become',begin:'begun',bite:'bitten',blow:'blown',break:'broken',bring:'brought',build:'built',buy:'bought',catch:'caught',choose:'chosen',come:'come',cost:'cost',cut:'cut',do:'done',draw:'drawn',drink:'drunk',drive:'driven',eat:'eaten',fall:'fallen',feel:'felt',fight:'fought',find:'found',fly:'flown',forget:'forgotten',forgive:'forgiven',freeze:'frozen',get:'gotten',give:'given',go:'gone',grow:'grown',hang:'hung',have:'had',hear:'heard',hide:'hidden',hit:'hit',hold:'held',hurt:'hurt',keep:'kept',know:'known',lay:'laid',lead:'led',leave:'left',lend:'lent',let:'let',lie:'lain',lose:'lost',make:'made',mean:'meant',meet:'met',pay:'paid',put:'put',quit:'quit',read:'read',ride:'ridden',ring:'rung',rise:'risen',run:'run',say:'said',see:'seen',sell:'sold',send:'sent',set:'set',shake:'shaken',shine:'shone',shoot:'shot',show:'shown',shut:'shut',sing:'sung',sink:'sunk',sit:'sat',sleep:'slept',speak:'spoken',spend:'spent',stand:'stood',steal:'stolen',stick:'stuck',strike:'struck',swear:'sworn',swim:'swum',take:'taken',teach:'taught',tear:'torn',tell:'told',think:'thought',throw:'thrown',understand:'understood',wake:'woken',wear:'worn',win:'won',write:'written'};
for (const [base, pp] of Object.entries(truth)) eq(`participle ${base}`, verbForms(base)?.participle, pp);

// Regular verbs keep coming from compromise.
eq("finish pp", verbForms("finish")?.participle, "finished");
eq("study pp", verbForms("study")?.participle, "studied");
eq("study 3rd", verbForms("study")?.third, "studies");
eq("stop gerund", verbForms("stop")?.gerund, "stopping");
eq("to-prefix", verbForms("to go")?.base, "go");

// Subject agreement across the 12.
const go = verbForms("go")!;
eq("she present simple", formFor(go, "present-simple", "she"), "goes");
eq("I present cont", formFor(go, "present-continuous", "I"), "am going");
eq("they past cont", formFor(go, "past-continuous", "they"), "were going");
eq("she present perfect", formFor(go, "present-perfect", "she"), "has gone");
eq("we pres perf cont", formFor(go, "present-perfect-continuous", "we"), "have been going");
eq("future perf cont", formFor(go, "future-perfect-continuous", "I"), "will have been going");
const beF = verbForms("be")!;
eq("be I present", formFor(beF, "present-simple", "I"), "am");
eq("be they past", formFor(beF, "past-simple", "they"), "were");
eq("be she pres perf", formFor(beF, "present-perfect", "she"), "has been");
eq("run past perfect", formFor(verbForms("run")!, "past-perfect", "I"), "had run");
eq("12 forms", Object.keys(allForms(go, "I")).length, 12);
eq("garbage rejected", verbForms("h3llo"), null);

console.log(fails ? `\n${fails} FAILED` : `all ${Object.keys(truth).length + 18} conjugation checks passed`);
process.exit(fails ? 1 : 0);
