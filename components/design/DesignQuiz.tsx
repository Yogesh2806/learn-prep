"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { QUIZ, type DesignQuestion } from "@/lib/design-data";
import { isTypingTarget, shuffle } from "@/lib/utils";
import { useStore } from "../store";
import { Btn, Icon, Label, Progress, useSessionState } from "../ui";
import { Explanation, OptionButton, Results } from "../shared";

type Round = { order: DesignQuestion[]; opts: string[][]; i: number; correct: number; wrong: string[]; picked: number | null; full: boolean };

function makeRound(qs: DesignQuestion[], full: boolean): Round {
  const order = shuffle(qs);
  return { order, opts: order.map((q) => shuffle([q.a, ...q.d])), i: 0, correct: 0, wrong: [], picked: null, full };
}

export default function DesignQuiz({ category }: { category: string }) {
  const { design, setDesign, record } = useStore();
  const pool = useMemo(() => (category === "All" ? QUIZ : QUIZ.filter((q) => q.c === category)), [category]);
  const [round, setRound] = useSessionState(`dquiz:${category}:round`, () => makeRound(pool, true));
  const [hint, setHint] = useState(false);
  const [finished, setFinished] = useSessionState<null | { pct: number; newBest: boolean; prev?: number }>(`dquiz:${category}:finished`, null);

  const q = round.order[round.i];
  const opts = round.opts[round.i];
  const answerIdx = q ? opts.indexOf(q.a) : -1;

  function answer(idx: number) {
    if (round.picked != null || !q) return;
    const right = idx === answerIdx;
    record(`design:${q.c}`, right);
    setRound((r) => ({ ...r, picked: idx, correct: r.correct + (right ? 1 : 0), wrong: right ? r.wrong : [...r.wrong, q.id] }));
  }

  function next() {
    if (round.picked == null) return;
    if (round.i + 1 < round.order.length) {
      setRound((r) => ({ ...r, i: r.i + 1, picked: null }));
      setHint(false);
      return;
    }
    const pct = Math.round((round.correct / round.order.length) * 100);
    const prev = design.bestQuiz[category];
    const newBest = round.full && (prev == null || pct > prev);
    if (newBest) setDesign((p) => ({ ...p, bestQuiz: { ...p.bestQuiz, [category]: pct } }));
    setFinished({ pct, newBest, prev });
  }

  function restart(onlyWrong: boolean) {
    const qs = onlyWrong ? pool.filter((x) => round.wrong.includes(x.id)) : pool;
    setRound(makeRound(qs, !onlyWrong));
    setHint(false);
    setFinished(null);
  }

  // useEffectEvent: always sees the latest state, without re-subscribing the listener.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (finished || isTypingTarget(e.target) || e.metaKey || e.ctrlKey) return;
    if (e.key >= "1" && e.key <= "4") answer(Number(e.key) - 1);
    else if (e.key === "Enter" && round.picked != null && (e.target as HTMLElement)?.tagName !== "BUTTON") next();
  });
  useEffect(() => {
    const on = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  if (finished) {
    const missed = pool.filter((x) => round.wrong.includes(x.id));
    return (
      <Results
        pct={finished.pct}
        line={`${round.correct} of ${round.order.length} correct · ${category}`}
        best={round.full ? (finished.newBest ? `New best — ${finished.prev != null ? `up from ${finished.prev}%` : "first round"}` : `Best for ${category} · ${finished.prev}%`) : null}
        note={finished.pct === 100 ? "Clean sweep. Try Recall — typing the term is the harder test." : finished.pct >= 80 ? "Strong. Drill the few you missed and this category is interview-ready." : finished.pct >= 50 ? "Solid base. The retry below is the fastest way to close the gap." : "Worth a flashcard pass through this category before quizzing again."}
        retryLabel={missed.length ? `Retry ${missed.length} wrong answer${missed.length === 1 ? "" : "s"}` : "Nothing to retry"}
        onRetry={missed.length ? () => restart(true) : undefined}
        onRestart={() => restart(false)}
        review={missed.map((m) => ({ title: m.q, body: m.a }))}
      />
    );
  }
  if (!q) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium tabular-nums">Question {round.i + 1} of {round.order.length}</span>
          <span className="text-[11px] text-muted">Score {round.correct}{round.full ? "" : " · retry"}</span>
        </div>
        <Progress value={round.i / round.order.length} />
      </div>

      <div className="flex flex-col gap-4 border border-rule bg-card p-5 sm:p-7">
        <Label>{q.c}</Label>
        <h2 className="text-[19px] leading-[1.35] font-medium tracking-[-0.015em] sm:text-[21px]">{q.q}</h2>
        <div className="flex flex-col gap-2">
          {opts.map((o, i) => (
            <OptionButton key={o} index={i} text={o} picked={round.picked} answer={answerIdx} onPick={() => answer(i)} />
          ))}
        </div>

        {round.picked == null ? (
          q.h && (hint ? (
            <p className="pop bg-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-graphite">{q.h}</p>
          ) : (
            <button type="button" onClick={() => setHint(true)} className="tap flex w-fit items-center gap-1.5 text-[12px] font-medium text-muted hover:text-ink">
              <Icon.bulb size={13} /> Show hint
            </button>
          ))
        ) : (
          <Explanation right={round.picked === answerIdx} text={q.e} />
        )}
      </div>

      <Btn variant="ink" size="lg" disabled={round.picked == null} onClick={next}>
        {round.i + 1 === round.order.length ? "See results" : "Next question"}
      </Btn>
    </div>
  );
}

