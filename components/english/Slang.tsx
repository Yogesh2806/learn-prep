"use client";

import { useMemo, useState } from "react";
import { REGISTER_LABEL, SLANG, todaysBatch, type SlangTerm } from "@/lib/slang";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { dayKey, mulberry32, shuffle } from "@/lib/utils";
import { useStore } from "../store";
import { Btn, Icon, Label, Progress, Source, SpeakBtn, Tag, useSessionState } from "../ui";
import { Explanation, OptionButton, useChoiceKeys } from "../shared";

type SlangProgress = { known: string[]; newToMe: Record<string, string> };
const daySeed = (d = dayKey()) => [...d].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function useSlangProgress() {
  const [p, setP] = useState<SlangProgress>(() => readJSON(KEYS.slang, { known: [], newToMe: {} }));
  const update = (fn: (p: SlangProgress) => SlangProgress) =>
    setP((cur) => {
      const next = fn(cur);
      writeJSON(KEYS.slang, next);
      return next;
    });
  return [p, update] as const;
}

export default function Slang({ mode }: { mode: "cards" | "quiz" }) {
  return mode === "quiz" ? <SlangQuiz /> : <SlangCards />;
}

// ================================================================== today's cards
function SlangCards() {
  const { record } = useStore();
  const [progress, setProgress] = useSlangProgress();
  // Fixed for the day (and for the session, so marking cards doesn't reshuffle the batch).
  const [batch] = useSessionState(`slang:batch:${dayKey()}`, () =>
    todaysBatch(new Set(progress.known), new Set(Object.keys(progress.newToMe)), mulberry32(daySeed())).map((s) => s.term),
  );
  const [i, setI] = useSessionState(`slang:i:${dayKey()}`, 0);
  const [tally, setTally] = useSessionState(`slang:tally:${dayKey()}`, { knew: 0, fresh: 0 });
  const terms = batch.map((t) => SLANG.find((s) => s.term === t)!).filter(Boolean);
  const card = terms[i];

  function mark(knew: boolean) {
    if (!card) return;
    setProgress((p) => {
      const newToMe = { ...p.newToMe };
      if (knew) delete newToMe[card.term];
      else newToMe[card.term] = dayKey();
      return { known: knew ? [...new Set([...p.known, card.term])] : p.known.filter((t) => t !== card.term), newToMe };
    });
    record("slang", knew, 3);
    setTally((t) => (knew ? { ...t, knew: t.knew + 1 } : { ...t, fresh: t.fresh + 1 }));
    setI(i + 1);
  }

  if (!card)
    return (
      <div className="pop flex flex-col items-start gap-4 border border-ink bg-card p-8">
        <Label>Today&apos;s batch done</Label>
        <span className="text-[56px] leading-none font-medium tracking-[-0.04em]">{tally.fresh}<span className="text-[20px] text-muted"> new to you</span></span>
        <p className="font-serif text-[16px] text-graphite">
          {tally.fresh ? "The new ones come back in tomorrow's batch until they stick. Try the quiz to lock them in." : "You knew every one. Tomorrow brings a fresh batch."}
        </p>
        <p className="text-[12px] text-muted">{progress.known.length} of {SLANG.length} terms known</p>
        <Btn variant="ink" onClick={() => setI(0)}>Flip through again</Btn>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium">Card {i + 1} of {terms.length}</span>
          <span className="text-[11px] text-muted">Today&apos;s batch · {progress.known.length}/{SLANG.length} known</span>
        </div>
        <Progress value={i / terms.length} />
      </div>
      <SlangCard key={card.term} s={card} />
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="strong" size="lg" onClick={() => mark(true)}>Knew it</Btn>
        <Btn variant="primary" size="lg" onClick={() => mark(false)}>New to me</Btn>
      </div>
      <p className="hidden text-center text-[11px] text-muted sm:block">“New to me” brings a term back tomorrow</p>
    </div>
  );
}

function SlangCard({ s }: { s: SlangTerm }) {
  return (
    <article className="pop flex flex-col gap-[18px] border border-ink bg-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[36px] leading-[1.05] font-medium tracking-[-0.03em]">{s.term}</h2>
        <SpeakBtn text={s.term.replace(/^-/, "")} label={`Hear “${s.term}”`} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {s.vibe.map((v, n) => <Tag key={v} tone={n === 0 ? "olive" : "neutral"}>{v}</Tag>)}
        <Tag>{REGISTER_LABEL[s.register]}</Tag>
      </div>
      <div className="h-px bg-rule" />
      <p className="font-serif text-[19px] leading-normal">{s.meaning}</p>
      <div className="flex flex-col gap-1 border-l-2 border-olive-line pl-3">
        <Label>In the wild</Label>
        <div className="flex items-start gap-1">
          <p className="flex-1 font-serif text-[15px] leading-relaxed text-graphite">“{s.example}”</p>
          <SpeakBtn variant="inline" text={s.example} label="Hear this example" />
        </div>
      </div>
      <div className="flex items-start gap-2 bg-soft px-3.5 py-3">
        <Icon.alert size={14} className="mt-0.5 shrink-0 text-graphite" />
        <span className="text-[12.5px] leading-snug text-graphite">{s.note}</span>
      </div>
      <Source>Hand-picked and hand-written list — no unfiltered sources</Source>
    </article>
  );
}

// ================================================================== quiz
type Q = { prompt: string; ask: string; options: string[]; answer: number; why: string };

function makeQuiz(): Q[] {
  return shuffle(SLANG).slice(0, 10).map((s, n) => {
    const others = shuffle(SLANG.filter((x) => x.term !== s.term)).slice(0, 3);
    if (n % 2 === 0) {
      const options = shuffle([s.meaning, ...others.map((o) => o.meaning)]);
      return { ask: "What does it mean?", prompt: s.term, options, answer: options.indexOf(s.meaning), why: `“${s.example}”` };
    }
    const options = shuffle([s.term, ...others.map((o) => o.term)]);
    return { ask: "Which term fits?", prompt: s.meaning, options, answer: options.indexOf(s.term), why: `“${s.example}”` };
  });
}

function SlangQuiz() {
  const { record } = useStore();
  const [qs, setQs] = useSessionState("slangquiz:qs", makeQuiz);
  const [i, setI] = useSessionState("slangquiz:i", 0);
  const [picked, setPicked] = useSessionState<number | null>("slangquiz:picked", null);
  const [score, setScore] = useSessionState("slangquiz:score", 0);
  const q = qs[i];
  const restart = useMemo(() => () => { setQs(makeQuiz()); setI(0); setPicked(null); setScore(0); }, [setQs, setI, setPicked, setScore]);

  function answer(idx: number) {
    if (!q || picked != null || idx >= q.options.length) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
    record("slang", idx === q.answer);
  }
  function next() {
    if (picked == null) return;
    setI(i + 1);
    setPicked(null);
  }
  useChoiceKeys((k) => ("pick" in k ? answer(k.pick) : next()));

  if (!q)
    return (
      <div className="pop flex flex-col items-start gap-4 border border-ink bg-card p-8">
        <Label>Quiz complete</Label>
        <span className="text-[56px] leading-none font-medium tracking-[-0.04em]">{score}<span className="text-muted">/{qs.length}</span></span>
        <p className="font-serif text-[16px] text-graphite">{score >= 8 ? "Fluent in group chat." : "Flip through today's cards, then try again."}</p>
        <Btn variant="primary" onClick={restart}>New quiz</Btn>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between"><span className="text-[12px] font-medium">Question {i + 1} of {qs.length}</span><span className="text-[11px] text-muted">Score {score}</span></div>
        <Progress value={i / qs.length} />
      </div>
      <div className="flex flex-col gap-4 border border-rule bg-card p-5 sm:p-7">
        <Label>{q.ask}</Label>
        <p className={q.ask.startsWith("What") ? "text-[28px] font-medium tracking-[-0.025em]" : "font-serif text-[18px] leading-snug"}>{q.prompt}</p>
        <div className="flex flex-col gap-2">
          {q.options.map((o, idx) => <OptionButton key={o} index={idx} text={o} picked={picked} answer={q.answer} onPick={() => answer(idx)} />)}
        </div>
        {picked != null && <Explanation right={picked === q.answer} label={picked === q.answer ? "Correct — in the wild" : "In the wild"} text={q.why} />}
      </div>
      <Btn variant="ink" size="lg" disabled={picked == null} onClick={next}>{i + 1 === qs.length ? "See results" : "Next question"}</Btn>
    </div>
  );
}
