"use client";

import { useMemo } from "react";
import { ai } from "@/lib/ai";
import type { TenseDrill } from "@/lib/ai-types";
import { allForms, SUBJECTS, VERB_NOTES, verbForms, type Subject } from "@/lib/conjugate";
import { FALLBACK_DRILLS } from "@/lib/tense-fallback";
import { ASPECT_INFO, ASPECTS, TENSE_BY_ID, TENSE_LESSONS, TENSES, TIME_LABEL, TIMES, type Aspect, type TenseId, type Time } from "@/lib/tense-meta";
import { cx, shuffle } from "@/lib/utils";
import { useStore } from "../store";
import { Btn, ErrorPanel, Icon, Label, Progress, Segmented, Skeleton, Source, SpeakBtn, Tag, useAsync, useSessionState } from "../ui";
import { Explanation, OptionButton, useChoiceKeys } from "../shared";

// ------------------------------------------------------------------ timeline glyphs
export function Glyph({ aspect, width = 64 }: { aspect: Aspect; width?: number }) {
  return (
    <svg width={width} height={22} viewBox="0 0 64 22" fill="none" aria-hidden className="text-ink">
      <path d="M2 11h60" stroke="var(--line)" strokeWidth="1.5" />
      {aspect === "simple" && <circle cx="32" cy="11" r="4" fill="currentColor" />}
      {aspect === "continuous" && (
        <>
          <path d="M18 11h28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 3v16" stroke="var(--muted)" strokeWidth="1.2" strokeDasharray="2 2" />
        </>
      )}
      {aspect === "perfect" && (
        <>
          <circle cx="20" cy="11" r="4" fill="currentColor" />
          <path d="M46 3v16" stroke="currentColor" strokeWidth="1.6" />
        </>
      )}
      {aspect === "perfect-continuous" && (
        <>
          <path d="M12 11h34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M46 3v16" stroke="currentColor" strokeWidth="1.6" />
        </>
      )}
    </svg>
  );
}

export default function Tenses({ mode }: { mode: "trainer" | "map" | "drill" }) {
  const { ui, setUI } = useStore();
  const [verb, setVerb] = useSessionState("tenses:verb", "go");
  const [subject, setSubject] = useSessionState<Subject>("tenses:subject", "I");
  // A detail page belongs to the tab it was opened from; switching tabs leaves it behind.
  const [opened, setOpened] = useSessionState<{ id: TenseId; from: string } | null>("tenses:opened", null);
  const detail = opened?.from === mode ? opened.id : null;
  const setDetail = (id: TenseId | null) => setOpened(id ? { id, from: mode } : null);
  const [focus, setFocus] = useSessionState<TenseId | null>("tenses:focus", null);

  const setMode = (m: string) => setUI({ englishModes: { ...ui.englishModes, tenses: m } });
  const open = (id: TenseId) => setDetail(id);
  const practise = (id: TenseId | null) => {
    setFocus(id);
    setDetail(null);
    setMode("drill");
  };

  if (detail) return <TenseDetail key={detail} id={detail} verb={verb} onOpen={open} onBack={() => setDetail(null)} onPractise={() => practise(detail)} onMap={() => { setDetail(null); setMode("map"); }} />;
  if (mode === "map") return <TenseMap onOpen={open} />;
  if (mode === "drill") return <TenseDrills key={focus ?? "mix"} focus={focus} onOpen={open} onClearFocus={() => setFocus(null)} />;
  return <TenseTrainer verb={verb} setVerb={setVerb} subject={subject} setSubject={setSubject} onOpen={open} onMap={() => setMode("map")} onDrill={() => practise(null)} />;
}

// ================================================================== trainer
function TenseTrainer({
  verb, setVerb, subject, setSubject, onOpen, onMap, onDrill,
}: { verb: string; setVerb: (v: string) => void; subject: Subject; setSubject: (s: Subject) => void; onOpen: (id: TenseId) => void; onMap: () => void; onDrill: () => void }) {
  const [time, setTime] = useSessionState<Time>("tenses:time", "present");
  const forms = useMemo(() => verbForms(verb), [verb]);
  const all = forms ? allForms(forms, subject) : null;
  const subj = SUBJECTS.find((s) => s.id === subject)!.id === "she" ? "she" : subject;
  const note = forms ? VERB_NOTES[forms.base] : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="verb" className="label-caps">Any verb</label>
          <input
            id="verb"
            value={verb}
            onChange={(e) => setVerb(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="h-12 rounded-[4px] border border-line bg-card px-3.5 text-[17px] font-medium outline-none focus:border-olive"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label-caps">Subject</span>
          <div className="flex flex-wrap gap-1.5">
            {SUBJECTS.map((s) => (
              <button key={s.id} type="button" onClick={() => setSubject(s.id)} aria-pressed={subject === s.id}
                className={cx("tap press h-12 rounded-[4px] border px-3 text-[13px]", subject === s.id ? "border-ink bg-ink font-medium text-on-ink" : "border-line bg-card text-graphite hover:border-muted")}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!forms ? (
        <p className="border border-dashed border-line bg-card p-4 text-[13px] text-graphite">Type a single English verb, like “go”, “finish” or “bring”.</p>
      ) : (
        <>
          {(!forms.known || note) && (
            <p className="bg-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-graphite">
              {!forms.known ? `“${forms.base}” isn't in our verb list, so these forms follow the regular pattern — double-check them. ` : ""}
              {note}
            </p>
          )}
          <div className="lg:hidden">
            <Segmented label="Time" tone="ink" size="sm" value={time} onChange={setTime} options={TIMES.map((t) => ({ id: t, label: TIME_LABEL[t] }))} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {TIMES.map((t) => (
              <div key={t} className={cx("flex flex-col", t !== time && "hidden lg:flex")}>
                <span className="mb-2 hidden text-[13px] font-bold lg:block">{TIME_LABEL[t]}</span>
                <div className="flex flex-col border border-rule bg-card">
                  {ASPECTS.map((a, i) => {
                    const id = `${t}-${a}` as TenseId;
                    return (
                      <button key={id} type="button" onClick={() => onOpen(id)} className={cx("tap flex min-h-[60px] items-center gap-3 px-4 py-2.5 text-left hover:bg-soft", i > 0 && "border-t border-rule")}>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[15px] font-medium">{subj === "she" ? "she" : subj} {all![id]}</span>
                            <span className="label-caps">{ASPECT_INFO[a].label}</span>
                          </div>
                          <span className="text-[12px] text-graphite">{TENSE_BY_ID[id].meaning}</span>
                        </div>
                        <Icon.right size={15} className="shrink-0 text-muted" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onMap} className="tap text-[13px] font-medium text-olive-ink hover:underline">How all 12 fit together →</button>
        <Btn variant="primary" onClick={onDrill}>Drill mixed tenses</Btn>
      </div>
      <Source>Forms · built on your device (compromise.js + a checked irregular-verb table) — works offline</Source>
    </div>
  );
}

// ================================================================== map
function TenseMap({ onOpen }: { onOpen: (id: TenseId) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] font-medium tracking-[-0.025em]">How English tense works</h1>
        <p className="max-w-[68ch] font-serif text-[17px] leading-relaxed">
          Every tense answers two questions. <strong className="font-semibold">When?</strong> — past, present or future. And <strong className="font-semibold">what shape is the action</strong> at that time — a whole thing, something in progress, something already done by a certain point, or something that has been running up to it. Three times × four shapes = twelve tenses. Learn the four shapes and you&apos;ve learned all twelve.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ASPECTS.map((a) => (
          <div key={a} className="flex flex-col gap-1.5">
            <Glyph aspect={a} />
            <span className="text-[14px] font-medium">{ASPECT_INFO[a].label}</span>
            <span className="text-[12px] leading-snug text-graphite">{ASPECT_INFO[a].meaning}</span>
          </div>
        ))}
      </div>
      <p className="-mt-2 text-[11px] text-muted">In the lines: a dot is a complete action · a bar is an action with duration · the tick is the moment you&apos;re talking about.</p>

      {TIMES.map((t) => (
        <section key={t} className="flex flex-col gap-2">
          <span className="text-[13px] font-bold">{TIME_LABEL[t]}</span>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {ASPECTS.map((a) => {
              const tn = TENSE_BY_ID[`${t}-${a}`];
              return (
                <button key={tn.id} type="button" onClick={() => onOpen(tn.id)} className="tap press flex flex-col gap-1.5 border border-rule bg-card p-3.5 text-left hover:border-ink">
                  <span className="label-caps">{tn.name}</span>
                  <span className="text-[12px] font-medium text-olive-ink">{tn.formula}</span>
                  <span className="font-serif text-[14.5px] leading-snug">{tn.example}</span>
                  <span className="text-[11.5px] leading-snug text-graphite">{tn.meaning}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <Source>Names, formulas and one-line meanings are fixed · tap any tense for a deeper, AI-written lesson</Source>
    </div>
  );
}

// ================================================================== detail
function UseRow({ label, example }: { label: string; example: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-medium">{label}</span>
      <div className="flex items-start gap-1">
        <span className="flex-1 font-serif text-[15.5px] text-graphite">{example}</span>
        <SpeakBtn variant="inline" text={example} />
      </div>
    </div>
  );
}

function TenseDetail({ id, verb, onOpen, onBack, onPractise, onMap }: { id: TenseId; verb: string; onOpen: (id: TenseId) => void; onBack: () => void; onPractise: () => void; onMap: () => void }) {
  const t = TENSE_BY_ID[id];
  const core = TENSE_LESSONS[id];
  const lesson = useAsync(`tense-explain:${id}`, () => ai("tense-explain", { tense: id }));
  const forms = verbForms(verb) ?? verbForms("go")!;
  const idx = TENSES.findIndex((x) => x.id === id);
  const prev = TENSES[(idx + 11) % 12];
  const next = TENSES[(idx + 1) % 12];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="tap flex h-9 items-center gap-1.5 text-[13px] font-medium text-olive-ink"><Icon.left size={14} /> Back</button>
          <button type="button" onClick={onMap} className="tap text-[12px] text-muted hover:text-ink">All 12 tenses</button>
        </div>
        <div className="flex flex-col gap-2.5">
          <Label>{TIME_LABEL[t.time]} · {ASPECT_INFO[t.aspect].label.toLowerCase()}</Label>
          <h1 className="text-[32px] leading-none font-medium tracking-[-0.03em] capitalize">{t.name}</h1>
          <div className="flex flex-wrap items-center gap-3"><Tag tone="olive">{t.formula}</Tag><Glyph aspect={t.aspect} /></div>
        </div>
        <p className="font-serif text-[19px] leading-normal">{t.meaning}</p>

        <div className="flex flex-col gap-3 border border-rule bg-card p-5">
          <Label>Use it for</Label>
          {core.uses.map((u) => <UseRow key={u.label} {...u} />)}
        </div>

        <div className="flex flex-col gap-2 border-l-[3px] border-ink bg-soft px-4 py-3.5">
          <Label className="!text-graphite">The common mistake</Label>
          <p className="flex items-start gap-2 font-serif text-[15px] text-graphite line-through"><Icon.cross size={15} className="mt-1 shrink-0 no-underline" /> {core.mistake.wrong}</p>
          <p className="flex items-start gap-2 font-serif text-[15px]"><Icon.check size={15} className="mt-1 shrink-0 text-olive-ink" /> {core.mistake.right}</p>
          <p className="text-[12.5px] leading-relaxed text-graphite">{core.mistake.why}</p>
        </div>

        <div className="flex flex-col gap-3 border border-dashed border-line p-5">
          <div className="flex items-center justify-between gap-3">
            <Label>More examples</Label>
            <Tag>AI</Tag>
          </div>
          {lesson.status === "error" ? (
            <ErrorPanel compact error={lesson.error} onRetry={lesson.retry} />
          ) : !lesson.data ? (
            <Skeleton title={false} lines={3} />
          ) : (
            lesson.data.uses.map((u) => <UseRow key={u.label} {...u} />)
          )}
        </div>
        <Source>Name, formula, meaning, uses, mistake &amp; clue words · curated · More examples · written by AI</Source>
      </div>

      <aside className="flex flex-col gap-4">
        <Btn variant="primary" size="lg" onClick={onPractise}>Practise this tense</Btn>
        <div className="flex flex-col gap-2 border border-rule bg-card p-4">
          <Label>With “{forms.base}”</Label>
          {SUBJECTS.map((s) => (
            <span key={s.id} className="text-[14px]"><span className="text-muted">{s.id === "she" ? "she" : s.id}</span> {allForms(forms, s.id)[id]}</span>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Clue words</Label>
          <div className="flex flex-wrap gap-1.5">{core.signals.map((s) => <Tag key={s}>{s}</Tag>)}</div>
        </div>
        <div className="flex justify-between gap-3 border-t border-rule pt-3 text-[12px]">
          <button type="button" onClick={() => onOpen(prev.id)} className="tap text-left capitalize text-graphite hover:text-ink">← {prev.name}</button>
          <button type="button" onClick={() => onOpen(next.id)} className="tap text-right capitalize text-graphite hover:text-ink">{next.name} →</button>
        </div>
      </aside>
    </div>
  );
}

// ================================================================== drills
type Prepared = TenseDrill & { shown: string[]; correct: number };

function prepare(drills: TenseDrill[]): Prepared[] {
  return drills.map((d) => {
    const shown = shuffle(d.options);
    return { ...d, shown, correct: shown.indexOf(d.options[d.answer]) };
  });
}
const clean = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, "").replace(/\s+/g, " ").trim();

function TenseDrills({ focus, onOpen, onClearFocus }: { focus: TenseId | null; onOpen: (id: TenseId) => void; onClearFocus: () => void }) {
  const { record } = useStore();
  const k = `tdrill:${focus ?? "mix"}`;
  const [seed, setSeed] = useSessionState(`${k}:seed`, () => Math.floor(Math.random() * 1e6));
  const set = useAsync(`drills:${focus}:${seed}`, async () => {
    try {
      // Hand-checked drills are ready offline, so don't keep the learner waiting on a busy model.
      const r = await ai("tense-drills", { focus, seed }, { cacheKey: `${focus}:${seed}`, quick: 12_000 });
      return { value: { drills: prepare(r.value.drills), saved: false }, stale: r.stale };
    } catch (e) {
      // Teaching layer unreachable: fall back to the hand-checked offline drills.
      const pool = FALLBACK_DRILLS.filter((d) => !focus || d.tense === focus);
      if (!pool.length) throw e;
      return { value: { drills: prepare(shuffle(pool).slice(0, 5)), saved: true }, stale: true };
    }
  });
  const [i, setI] = useSessionState(`${k}:i`, 0);
  const [picked, setPicked] = useSessionState<number | null>(`${k}:picked`, null);
  const [typeMode, setTypeMode] = useSessionState("tdrill:typeMode", false);
  const [typed, setTyped] = useSessionState(`${k}:typed`, "");
  const [score, setScore] = useSessionState(`${k}:score`, 0);

  function pick(idx: number) {
    const cur = set.data?.drills[i];
    if (!cur || typeMode || picked != null || idx >= cur.shown.length) return;
    setPicked(idx);
    if (idx === cur.correct) setScore((s) => s + 1);
    record(`tense:${cur.tense}`, idx === cur.correct);
  }
  function nextDrill() {
    if (!set.data || picked == null || i >= set.data.drills.length) return;
    setI(i + 1);
    setPicked(null);
    setTyped("");
  }
  useChoiceKeys((k) => ("pick" in k ? pick(k.pick) : nextDrill()));

  if (set.status === "error") return <ErrorPanel error={set.error} onRetry={set.retry} />;
  if (!set.data) return <div className="border border-rule bg-card p-6"><Skeleton title={false} lines={5} /><Source className="mt-4">Writing fresh drills…</Source></div>;

  const drills = set.data.drills;
  const d = drills[i];
  const over = i >= drills.length;
  const nextRound = () => { setSeed(Math.floor(Math.random() * 1e6)); setI(0); setPicked(null); setScore(0); setTyped(""); };

  if (over)
    return (
      <div className="pop flex flex-col items-start gap-4 border border-ink bg-card p-8">
        <Label>Round complete</Label>
        <span className="text-[56px] leading-none font-medium tracking-[-0.04em]">{score}<span className="text-muted">/{drills.length}</span></span>
        <p className="font-serif text-[16px] text-graphite">{score === drills.length ? "Every tense spotted. Try typing the answers next — it's harder." : "Each answer's explanation names the clue that decides the tense. Those clues are the whole game."}</p>
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" onClick={nextRound}>5 more</Btn>
          {focus && <Btn variant="strong" onClick={onClearFocus}>Mix all tenses</Btn>}
        </div>
      </div>
    );

  const answerPhrase = d.options[d.answer];
  const typedRight = clean(typed) === clean(answerPhrase);
  const answered = picked != null;
  const right = answered && (typeMode ? typedRight : picked === d.correct);

  const submitTyped = () => {
    if (!typed.trim() || answered) return;
    setPicked(typedRight ? d.correct : -1);
    if (typedRight) setScore((s) => s + 1);
    // Typing the form is harder than choosing it, so it's worth more.
    record(`tense:${d.tense}`, typedRight, 15);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {focus ? <Tag tone="olive">{TENSE_BY_ID[focus].name}</Tag> : <Tag>All 12 tenses</Tag>}
          {set.data.saved && <Tag>saved drills · offline</Tag>}
        </div>
        <div className="w-[190px]">
          <Segmented label="Answer style" size="sm" tone="ink" value={typeMode ? "type" : "choose"} onChange={(v) => { setTypeMode(v === "type"); setPicked(null); setTyped(""); }} options={[{ id: "choose", label: "Choose" }, { id: "type", label: "Type it" }]} />
        </div>
      </div>
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between"><span className="text-[12px] font-medium">Drill {i + 1} of {drills.length}</span><span className="text-[11px] text-muted">Score {score}</span></div>
        <Progress value={i / drills.length} />
      </div>

      <div className="flex flex-col gap-4 border border-ink bg-card p-5 sm:p-7">
        <Label>Which tense fits?</Label>
        <p className="font-serif text-[20px] leading-normal">
          {d.sentence.split("___")[0]}
          <span className="mx-1 inline-block min-w-[80px] border-b-2 border-ink px-1 text-center font-sans text-[16px] font-medium text-olive-ink">{answered ? answerPhrase : " "}</span>
          {d.sentence.split("___")[1]}
          <span className="ml-2 font-sans text-[13px] text-muted">({d.verb})</span>
        </p>

        {typeMode ? (
          <div className="flex gap-2">
            <label htmlFor="drill-type" className="sr-only">Type the verb phrase</label>
            <input id="drill-type" value={typed} disabled={answered} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitTyped()} placeholder={`form of “${d.verb}”`} autoComplete="off" autoCapitalize="none" spellCheck={false}
              className="h-12 min-w-0 flex-1 rounded-[4px] border border-line bg-paper px-3.5 text-[16px] outline-none focus:border-olive" />
            <Btn variant="primary" disabled={answered} onClick={submitTyped}>Check</Btn>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {d.shown.map((o, idx) => (
              <OptionButton key={o} index={idx} text={o} picked={picked} answer={d.correct} onPick={() => pick(idx)} />
            ))}
          </div>
        )}

        {answered && (
          <>
            <Explanation right={right} label={right ? `Correct — ${TENSE_BY_ID[d.tense].name}` : `It's the ${TENSE_BY_ID[d.tense].name}`} text={d.why} />
            <button type="button" onClick={() => onOpen(d.tense)} className="tap w-fit text-[12px] font-medium text-olive-ink hover:underline">Learn the {TENSE_BY_ID[d.tense].name} →</button>
          </>
        )}
      </div>

      <Btn variant="ink" size="lg" disabled={!answered} onClick={nextDrill}>
        {i + 1 === drills.length ? "Finish round" : "Next drill"}
      </Btn>
      <Source>{set.data.saved ? "Saved, hand-checked drills (the teaching layer is unreachable)" : "Drills & explanations written by AI, checked for one blank, three distinct options and a valid tense"}</Source>
    </div>
  );
}
