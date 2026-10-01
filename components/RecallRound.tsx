"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { grade, letterHint, type Grade } from "@/lib/recall-match";
import { cx, shuffle } from "@/lib/utils";
import { Btn, Icon, Label, Progress, useSessionState, useToast } from "./ui";
import { Results } from "./shared";

// Free recall: read the meaning, type the term. Shared by Design and Vocabulary.

export type RecallItem = { id: string; prompt: string; answer: string; tag: string; extra?: ReactNode };

type Props = {
  /** Names the round for the session, so it resumes after switching tabs. */
  id: string;
  items: RecallItem[];
  /** Called once per item with the final verdict (after any "I got it right" override). */
  onResult: (id: string, correct: boolean) => void;
  /** Full rounds report their score so the caller can keep a best. Returns the best label. */
  onFinish?: (pct: number, full: boolean) => string | null;
  /** What the learner types: "term" (Design) or "word" (Vocabulary). */
  noun?: string;
  promptLabel?: string;
  finishNote?: (pct: number) => string;
  source?: ReactNode;
};

type Verdict = Grade | "revealed" | "override";

export default function RecallRound({ id, items, onResult, onFinish, noun = "term", promptLabel = `Name the ${noun}`, finishNote, source }: Props) {
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  const toast = useToast();
  // Round and progress survive leaving the tab; `id` names this round for the session.
  const [round, setRound] = useSessionState(`recall:${id}:round`, () => ({ order: shuffle(items), full: true }));
  const [i, setI] = useSessionState(`recall:${id}:i`, 0);
  const [value, setValue] = useSessionState(`recall:${id}:value`, "");
  const [verdict, setVerdict] = useSessionState<Verdict | null>(`recall:${id}:verdict`, null);
  const [typed, setTyped] = useSessionState(`recall:${id}:typed`, "");
  const [hint, setHint] = useState(false);
  const [score, setScore] = useSessionState(`recall:${id}:score`, { correct: 0, missed: [] as string[] });
  const [done, setDone] = useSessionState<null | { pct: number; best: string | null }>(`recall:${id}:done`, null);
  const input = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const item = round.order[i];
  const good = verdict === "exact" || verdict === "close" || verdict === "override";

  useEffect(() => {
    if (verdict) nextBtn.current?.focus();
    else if (matchMedia("(min-width: 640px)").matches) input.current?.focus();
  }, [verdict, i]);

  function settle(v: Verdict, t: string) {
    const right = v === "exact" || v === "close";
    setVerdict(v);
    setTyped(t);
    setScore((s) => ({ correct: s.correct + (right ? 1 : 0), missed: right ? s.missed : [...s.missed, item.id] }));
    onResult(item.id, right);
  }

  function check() {
    if (verdict || !item) return;
    const t = value.trim();
    const g = grade(t, item.answer);
    if (g === "empty") {
      input.current?.classList.remove("nudge");
      void input.current?.offsetWidth;
      input.current?.classList.add("nudge");
      input.current?.focus();
      return;
    }
    settle(g, t);
  }

  function override() {
    setVerdict("override");
    setScore((s) => ({ correct: s.correct + 1, missed: s.missed.filter((id) => id !== item.id) }));
    onResult(item.id, true);
    toast("Counted as correct");
  }

  function next() {
    if (i + 1 < round.order.length) {
      setI(i + 1);
      setValue("");
      setVerdict(null);
      setHint(false);
      return;
    }
    const pct = Math.round((score.correct / round.order.length) * 100);
    setDone({ pct, best: onFinish?.(pct, round.full) ?? null });
  }

  function restart(onlyMissed: boolean) {
    const pool = onlyMissed ? items.filter((x) => score.missed.includes(x.id)) : items;
    setRound({ order: shuffle(pool), full: !onlyMissed });
    setI(0);
    setValue("");
    setVerdict(null);
    setHint(false);
    setScore({ correct: 0, missed: [] });
    setDone(null);
  }

  if (done) {
    const missed = items.filter((x) => score.missed.includes(x.id));
    return (
      <Results
        pct={done.pct}
        line={`${score.correct} of ${round.order.length} recalled`}
        best={done.best}
        note={finishNote?.(done.pct) ?? (done.pct >= 80 ? "Strong — recall is much harder than recognition, so this is a real signal." : done.pct >= 50 ? "Recognition is ahead of recall. The retry below closes exactly that gap." : "Normal for a first pass — typing from memory is the hardest test.")}
        retryLabel={missed.length ? `Retry ${missed.length} missed` : "Nothing missed"}
        onRetry={missed.length ? () => restart(true) : undefined}
        onRestart={() => restart(false)}
        review={missed.map((m) => ({ title: m.answer, body: m.prompt }))}
        reviewTitle="To review"
      />
    );
  }
  if (!item) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium tabular-nums">{Noun} {i + 1} of {round.order.length}</span>
          <span className="text-[11px] text-muted">Recalled {score.correct}{round.full ? "" : " · retry"}</span>
        </div>
        <Progress value={i / round.order.length} />
      </div>

      <div className="flex flex-col gap-4 border border-rule bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <Label>{item.tag}</Label>
          <Label>{promptLabel}</Label>
        </div>
        <p className="font-serif text-[19px] leading-normal sm:text-[21px]">{item.prompt}</p>
        {item.extra}

        <label className="sr-only" htmlFor="recall-input">Type the {noun}</label>
        <input
          id="recall-input"
          ref={input}
          value={value}
          disabled={!!verdict}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          }}
          placeholder={`Type the ${noun}…`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          className="h-[54px] rounded-[4px] border border-line bg-paper px-4 text-[16px] font-medium outline-none placeholder:font-normal placeholder:text-muted focus:border-olive focus:bg-card disabled:opacity-80"
        />

        {!verdict &&
          (hint ? (
            <p className="pop bg-soft px-3.5 py-2.5 text-[15px] font-semibold tracking-[0.15em] text-graphite">{letterHint(item.answer)}</p>
          ) : (
            <button type="button" onClick={() => setHint(true)} className="tap flex w-fit items-center gap-1.5 text-[12px] font-medium text-muted hover:text-ink">
              <Icon.bulb size={13} /> Show letter hint
            </button>
          ))}

        {verdict && (
          <div className={cx("pop flex flex-col gap-1.5 border-l-[3px] px-4 py-3", good ? "border-olive bg-olive-tint" : "border-ink bg-soft")}>
            <span className={cx("label-caps flex items-center gap-1.5", good ? "!text-olive-ink" : "!text-ink")}>
              {good ? <Icon.check size={12} /> : <Icon.cross size={12} />}
              {verdict === "exact" ? "Correct" : verdict === "close" ? "Close enough — counted" : verdict === "override" ? "Counted as correct" : verdict === "revealed" ? "Answer" : "Not quite"}
            </span>
            <span className="text-[16px] font-medium tracking-[-0.01em]">{item.answer}</span>
            {typed && (verdict === "close" || verdict === "wrong") && <span className="text-[12.5px] text-muted">You typed “{typed}”.</span>}
            {(verdict === "wrong" || verdict === "revealed") && (
              <button type="button" onClick={override} className="tap press mt-1 w-fit rounded-[4px] border border-line bg-card px-3 py-2 text-[12px] font-medium text-graphite hover:border-muted hover:text-ink">
                I actually got this right
              </button>
            )}
          </div>
        )}
        {source}
      </div>

      {!verdict ? (
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="strong" size="lg" onClick={() => settle("revealed", value.trim())}>Reveal answer</Btn>
          <Btn variant="primary" size="lg" onClick={check}>Check</Btn>
        </div>
      ) : (
        <Btn ref={nextBtn} variant="ink" size="lg" onClick={next}>
          {i + 1 === round.order.length ? "See results" : `Next ${noun}`}
        </Btn>
      )}
    </div>
  );
}
