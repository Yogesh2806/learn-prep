"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { ai } from "@/lib/ai";
import { XP } from "@/lib/gamify";
import { lookalikes } from "@/lib/datamuse";
import { WORD_POOL } from "@/lib/english-data";
import { buildQueue, enrolMiss, GRADES, preview, rate, type Grade } from "@/lib/fsrs";
import { cx, isTypingTarget, shuffle } from "@/lib/utils";
import { loadWordCard, mapLimit, type WordCard } from "@/lib/words";
import RecallRound from "../RecallRound";
import { useStore } from "../store";
import { Btn, Empty, ErrorPanel, Icon, Label, Progress, Skeleton, Source, SpeakBtn, Tag, useAsync, useSessionState, useToast } from "../ui";
import { Explanation, OptionButton, Results, useChoiceKeys } from "../shared";

export default function Vocabulary({ mode }: { mode: "flashcards" | "quiz" | "recall" }) {
  if (mode === "quiz") return <VocabQuiz />;
  if (mode === "recall") return <VocabRecall />;
  return <VocabCards />;
}

// ================================================================== flashcards (FSRS)
function VocabCards() {
  const { deck, setDeck, award, studied } = useStore();
  const toast = useToast();
  const [extraNew, setExtraNew] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState(0);

  const { due, fresh, queue } = useMemo(() => {
    const q = buildQueue(deck, WORD_POOL);
    const more = extraNew ? WORD_POOL.filter((w) => !deck.cards[w] && !q.fresh.includes(w)).slice(0, extraNew) : [];
    return { ...q, queue: [...q.queue, ...more] };
  }, [deck, extraNew]);
  // Don't show the card you just rated straight back unless it's the only one left.
  const candidates = queue.filter((w) => !skipped.includes(w));
  const current = candidates.find((w) => w !== last) ?? candidates[0] ?? null;

  const card = useAsync(current ? `vcard:${current}` : null, () => loadWordCard(current!));
  // Warm the next word while this one is being studied; the caches keep the result.
  const upNext = candidates.find((w) => w !== current && w !== last) ?? null;
  useEffect(() => {
    if (card.status !== "ready" || !upNext) return;
    loadWordCard(upNext).catch(() => {});
  }, [card.status, upNext]);
  const intervals = useMemo(() => (current ? preview(deck, current) : null), [deck, current]);

  function grade(r: Grade) {
    if (!current || !revealed) return;
    setDeck((d) => rate(d, current, r));
    setLast(current);
    setRevealed(false);
    setReviewed((n) => n + 1);
    studied();
    if (r >= 3) award(XP.review); // self-graded, so a small reward
    if (r === 1) toast("Back in a minute");
  }

  // useEffectEvent: always sees the latest state, without re-subscribing the listener.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey) return;
    if ((e.key === " " || e.key === "Enter") && (e.target as HTMLElement)?.tagName !== "BUTTON") {
      e.preventDefault();
      setRevealed(true);
    } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) grade(Number(e.key) as Grade);
  });
  useEffect(() => {
    const on = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  if (!current)
    return (
      <Empty
        title="Inbox zero, vocabulary edition"
        body="Nothing is due right now. Reviewing early doesn't help you remember more — but you can take on a few new words."
        action={<Btn variant="strong" onClick={() => setExtraNew((n) => n + 5)}>Learn 5 new words</Btn>}
      />
    );

  const w = card.data;
  const isNew = !deck.cards[current];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium tabular-nums">{candidates.length} to go{reviewed ? ` · ${reviewed} done` : ""}</span>
          <span className="text-[11px] text-muted">{fresh.length} new · {due.length} review</span>
        </div>
        <Progress value={reviewed / Math.max(reviewed + candidates.length, 1)} />
      </div>

      <article className="flex min-h-[380px] flex-col gap-4 border border-ink bg-card p-6 sm:p-8">
        {card.status === "error" ? (
          <>
            <ErrorPanel error={card.error} onRetry={card.retry} />
            <Btn variant="quiet" onClick={() => setSkipped((s) => [...s, current])}>Skip this word for now</Btn>
          </>
        ) : !w ? (
          <Skeleton lines={3} />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-[32px] leading-[1.05] font-medium tracking-[-0.03em] capitalize">{w.word}</h2>
                  {isNew && <Tag tone="olive">new</Tag>}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {w.entry.ipa && <span className="font-serif text-[15px] text-graphite">{w.entry.ipa}</span>}
                  <Tag>{w.sense.pos}</Tag>
                </div>
              </div>
              <SpeakBtn text={w.word} audio={w.entry.audio} label={`Hear ${w.word}`} />
            </div>
            <div className="h-px bg-rule" />
            {!revealed ? (
              <button type="button" onClick={() => setRevealed(true)} className="tap flex flex-1 flex-col items-center justify-center gap-2 py-10 text-muted hover:text-ink">
                <span className="text-[13px] font-medium">What does it mean?</span>
                <span className="text-[11px] tracking-[0.1em] uppercase">Tap or press space to reveal</span>
              </button>
            ) : (
              <div className="pop flex flex-1 flex-col gap-4">
                <p className="font-serif text-[19px] leading-normal">{w.sense.definition}</p>
                {w.example && (
                  <div className="flex items-start gap-1.5 border-l-2 border-olive-line pl-3">
                    <p className="flex-1 font-serif text-[15px] leading-relaxed text-graphite">{w.example}</p>
                    <SpeakBtn variant="inline" text={w.example} label="Hear this example" />
                  </div>
                )}
                {w.entry.synonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{w.entry.synonyms.slice(0, 4).map((s) => <Tag key={s}>{s}</Tag>)}</div>
                )}
                <MemoryHook word={w} />
              </div>
            )}
          </>
        )}
      </article>

      {w && revealed ? (
        <div className="flex flex-col gap-2">
          <Label>How well did you know it?</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {GRADES.map((g) => (
              <button
                key={g.rating}
                type="button"
                onClick={() => grade(g.rating)}
                className={cx(
                  "tap press flex h-[58px] flex-col items-center justify-center gap-0.5 rounded-[4px] border",
                  g.rating === 3 ? "border-olive bg-olive text-on-olive" : g.rating === 1 ? "border-ink bg-card text-ink" : "border-line bg-card text-graphite hover:border-muted",
                )}
              >
                <span className="text-[13px] font-medium">{g.label}</span>
                <span className={cx("text-[10px]", g.rating === 3 ? "opacity-80" : "text-muted")}>{intervals?.[g.rating]}</span>
              </button>
            ))}
          </div>
          <p className="hidden text-center text-[11px] text-muted sm:block">Keys 1–4 grade · the time under each button is when you&apos;ll see the word again</p>
        </div>
      ) : (
        w && <Btn variant="ink" size="lg" onClick={() => setRevealed(true)}>Reveal meaning</Btn>
      )}

      {w && (
        <Source>
          Definition · {w.entry.sources.join(" + ")}{w.entry.curated ? " (everyday sense pre-selected)" : w.sensePicked ? " (everyday sense picked by AI)" : ""} · Example · {w.example && w.entry.senses.some((s) => s.example === w.example) ? "dictionary" : "AI"} · Scheduling · FSRS
        </Source>
      )}
    </div>
  );
}

function MemoryHook({ word }: { word: WordCard }) {
  const [on, setOn] = useState(false);
  const hook = useAsync(on ? `hook:${word.word}` : null, () => ai("mnemonic", { term: word.word, definition: word.sense.definition }));
  if (!on)
    return (
      <button type="button" onClick={() => setOn(true)} className="tap press flex h-10 w-full items-center justify-center gap-1.5 rounded-[4px] border border-dashed border-line text-[12px] font-medium text-graphite hover:border-muted hover:text-ink">
        <Icon.bulb size={13} /> Give me a memory hook
      </button>
    );
  return (
    <div className="pop border-l-[3px] border-olive bg-olive-tint px-4 py-3">
      <Label className="!text-olive-ink">Memory hook · AI</Label>
      {hook.status === "error" ? (
        <div className="mt-2"><ErrorPanel compact error={hook.error} onRetry={hook.retry} /></div>
      ) : hook.status !== "ready" ? (
        <div className="mt-2 flex flex-col gap-2"><div className="skeleton h-3.5 w-full" /><div className="skeleton h-3.5 w-2/3" /></div>
      ) : (
        <p className="mt-1 font-serif text-[15px] leading-relaxed">{hook.data!.hook}</p>
      )}
    </div>
  );
}

// ================================================================== shared loading for quiz / recall
/** Words you've met, topped up from the start of the pool so round one isn't empty. */
function roundWords(seen: string[], n: number) {
  const base = shuffle(seen).slice(0, n);
  const fill = WORD_POOL.filter((w) => !base.includes(w)).slice(0, Math.max(0, n - base.length));
  return shuffle([...base, ...fill]);
}

function useRoundCards(words: string[], key: string) {
  return useAsync(`round:${key}`, async () => {
    // Rounds test the meaning only, so skip the AI example sentence.
    const settled = await mapLimit(words, 5, (w) => loadWordCard(w, { needExample: false }));
    const ok = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value.value] : []));
    if (ok.length < Math.min(4, words.length)) throw settled.find((s) => s.status === "rejected")?.reason ?? new Error("Couldn't load words.");
    return { value: ok, stale: settled.some((s) => s.status === "fulfilled" && s.value.stale) };
  });
}

// ================================================================== quiz
type QuizQ = { word: string; definition: string; options: string[]; answer: number };

function VocabQuiz() {
  const { deck, setDeck, record } = useStore();
  // The round (its words) and your progress survive switching tabs.
  const [round, setRound] = useSessionState("vquiz:round", () => ({ key: String(Date.now()), words: roundWords(Object.keys(deck.cards), 10) }));
  const roundKey = round.key;
  const words = round.words;
  const cards = useRoundCards(words, roundKey);

  const questions = useAsync(cards.data ? `quizq:${roundKey}` : null, async () => {
    const qs = await Promise.all(
      cards.data!.map(async (c): Promise<QuizQ> => {
        const others = shuffle(WORD_POOL.filter((w) => w !== c.word)).slice(0, 3);
        // A word *spelled* like the answer tempts without being right; offline: pool words only.
        const looks = await lookalikes(c.word, 2, c.sense.pos).catch(() => [] as string[]);
        // A distractor named in the definition itself ("Practical, …" for pragmatic) is a second right answer.
        const defWords = new Set(c.sense.definition.toLowerCase().match(/[a-z]+/g) ?? []);
        const distractors = [...looks, ...others].filter((x, i, a) => a.indexOf(x) === i && !defWords.has(x)).slice(0, 3);
        const options = shuffle([c.word, ...distractors]);
        return { word: c.word, definition: c.sense.definition, options, answer: options.indexOf(c.word) };
      }),
    );
    return { value: qs, stale: false };
  });

  const [i, setI] = useSessionState("vquiz:i", 0);
  const [picked, setPicked] = useSessionState<number | null>("vquiz:picked", null);
  const [score, setScore] = useSessionState("vquiz:score", { correct: 0, missed: [] as string[] });
  const [done, setDone] = useSessionState("vquiz:done", false);

  const qs = questions.data;
  function answer(idx: number) {
    const q = qs?.[i];
    if (!q || done || picked != null || idx >= q.options.length) return;
    setPicked(idx);
    record("vocab", idx === q.answer);
    if (idx === q.answer) setScore((s) => ({ ...s, correct: s.correct + 1 }));
    else {
      setScore((s) => ({ ...s, missed: [...s.missed, q.word] }));
      setDeck((d) => enrolMiss(d, q.word));
    }
  }
  function next() {
    if (!qs || picked == null || done) return;
    if (i + 1 < qs.length) {
      setI(i + 1);
      setPicked(null);
    } else setDone(true);
  }
  useChoiceKeys((k) => ("pick" in k ? answer(k.pick) : next()));

  if (cards.status === "error") return <ErrorPanel error={cards.error} onRetry={cards.retry} />;
  if (!qs) return <div className="border border-rule bg-card p-6"><Skeleton lines={4} /><Source className="mt-4">Loading 10 words and building look-alike options…</Source></div>;

  if (done) {
    const pct = Math.round((score.correct / qs.length) * 100);
    return (
      <Results
        pct={pct}
        line={`${score.correct} of ${qs.length} correct`}
        best={score.missed.length ? `${score.missed.length} missed word${score.missed.length === 1 ? "" : "s"} added to your review deck` : null}
        note={pct >= 80 ? "Strong recognition. Recall mode is the harder next step." : "Missed words are now scheduled for review — they'll come back until they stick."}
        retryLabel="New round"
        onRetry={() => { setRound({ key: String(Date.now()), words: roundWords(Object.keys(deck.cards), 10) }); setI(0); setPicked(null); setScore({ correct: 0, missed: [] }); setDone(false); }}
        onRestart={() => { setI(0); setPicked(null); setScore({ correct: 0, missed: [] }); setDone(false); }}
        review={qs.filter((q) => score.missed.includes(q.word)).map((q) => ({ title: q.word, body: q.definition }))}
      />
    );
  }

  const q = qs[i];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium">Question {i + 1} of {qs.length}</span>
          <span className="text-[11px] text-muted">Score {score.correct}</span>
        </div>
        <Progress value={i / qs.length} />
      </div>
      <div className="flex flex-col gap-4 border border-rule bg-card p-5 sm:p-7">
        <Label>Which word means</Label>
        <p className="font-serif text-[19px] leading-normal">“{q.definition}”</p>
        <div className="flex flex-col gap-2">
          {q.options.map((o, idx) => (
            <OptionButton
              key={o}
              index={idx}
              text={o}
              picked={picked}
              answer={q.answer}
              onPick={() => answer(idx)}
            />
          ))}
        </div>
        {picked != null && <Explanation right={picked === q.answer} text={picked === q.answer ? `“${q.word}” — nicely done.` : `It's “${q.word}”. It's now in your review deck.`} />}
      </div>
      <Btn variant="ink" size="lg" disabled={picked == null} onClick={next}>
        {i + 1 === qs.length ? "See results" : "Next question"}
      </Btn>
      <Source>Definitions · dictionary · Look-alike options · Datamuse · Missed words go to your FSRS review deck</Source>
    </div>
  );
}

// ================================================================== recall
function VocabRecall() {
  const { deck, setDeck, record } = useStore();
  const [round] = useSessionState("vrecall:round", () => ({ key: String(Date.now()), words: roundWords(Object.keys(deck.cards), 12) }));
  const cards = useRoundCards(round.words, `recall:${round.key}`);

  if (cards.status === "error") return <ErrorPanel error={cards.error} onRetry={cards.retry} />;
  if (!cards.data) return <div className="border border-rule bg-card p-6"><Skeleton lines={4} /></div>;
  return (
    <RecallRound
      id={`vocab:${round.key}`}
      items={cards.data.map((c) => ({ id: c.word, prompt: c.sense.definition, answer: c.word, tag: c.sense.pos }))}
      noun="word"
      onResult={(id, correct) => {
        record("vocab", correct, 15);
        if (!correct) setDeck((d) => enrolMiss(d, id));
      }}
      source={<Source>Definition · dictionary · Misses go to your review deck</Source>}
    />
  );
}
