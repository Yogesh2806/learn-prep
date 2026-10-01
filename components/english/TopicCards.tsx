"use client";

import { useState } from "react";
import { ai } from "@/lib/ai";
import type { MCQ } from "@/lib/ai-types";
import { GRAMMAR_TOPICS, PUNCTUATION_TOPICS } from "@/lib/english-data";
import { TOPIC_LESSONS } from "@/lib/english-lessons";
import { cx, shuffle } from "@/lib/utils";
import { useStore } from "../store";
import { Btn, Chip, ErrorPanel, Icon, Label, Progress, Skeleton, Source, SpeakBtn, Tag, useAsync, useSessionState } from "../ui";
import { Explanation, OptionButton, useChoiceKeys } from "../shared";

type Kind = "grammar" | "punctuation";

const lessonFor = (topic: string) => TOPIC_LESSONS[topic as keyof typeof TOPIC_LESSONS];

/** Fresh examples + a new check from the AI; `seed` varies them. */
function useFreshCheck(topic: string | null, kind: Kind, seed: number | null, quick?: number) {
  return useAsync(topic && seed != null ? `fresh:${kind}:${topic}:${seed}` : null, () =>
    ai("grammar-card", { topic: topic!, kind, seed: seed! }, { cacheKey: `${topic}:${seed}`, quick }),
  );
}

function Check({ mcq, onAnswer }: { mcq: MCQ; onAnswer?: (right: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <>
      <p className="font-serif text-[16px] leading-snug">{mcq.question}</p>
      <div className="flex flex-col gap-2">
        {mcq.options.map((o, idx) => (
          <OptionButton key={o} index={idx} text={o} picked={picked} answer={mcq.answer} onPick={() => {
            if (picked != null) return;
            setPicked(idx);
            onAnswer?.(idx === mcq.answer);
          }} />
        ))}
      </div>
      {picked != null && <Explanation right={picked === mcq.answer} text={mcq.why} />}
    </>
  );
}

export default function TopicCards({ kind, mode }: { kind: Kind; mode: "cards" | "practice" }) {
  const topics = kind === "grammar" ? GRAMMAR_TOPICS : PUNCTUATION_TOPICS;
  return mode === "practice" ? <Practice topics={[...topics]} kind={kind} /> : <Cards topics={[...topics]} kind={kind} />;
}

// ================================================================== concept cards
function Cards({ topics, kind }: { topics: string[]; kind: Kind }) {
  const [i, setI] = useSessionState(`${kind}:cards:i`, 0);
  const topic = topics[i];
  const c = lessonFor(topic);
  const [seed, setSeed] = useSessionState<number | null>(`${kind}:cards:seed`, null);
  const fresh = useFreshCheck(topic, kind, seed);
  const { record } = useStore();
  const tag = `${kind === "grammar" ? "grammar" : "punct"}:${topic}`;
  const go = (n: number) => { setI((n + topics.length) % topics.length); setSeed(null); };

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* topic list: chips on mobile, a quiet list on desktop */}
      <nav aria-label={`${kind} topics`} className="no-bar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-px lg:overflow-visible lg:px-0">
        {topics.map((t, idx) => (
          <span key={t} className="contents">
            <span className="lg:hidden"><Chip active={idx === i} onClick={() => go(idx)}>{t}</Chip></span>
            <button type="button" onClick={() => go(idx)} aria-current={idx === i ? "true" : undefined}
              className={cx("tap hidden border-l-2 px-3 py-1.5 text-left text-[12.5px] leading-snug lg:block", idx === i ? "border-ink font-medium text-ink" : "border-transparent text-graphite hover:text-ink")}>
              {t}
            </button>
          </span>
        ))}
      </nav>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium">{i + 1} of {topics.length}</span>
          <Label>{kind === "grammar" ? "Grammar rule" : "Punctuation"}</Label>
        </div>
        <article key={topic} className="flex flex-col gap-5 border border-ink bg-card p-6 sm:p-8">
          <h2 className="text-[26px] leading-tight font-medium tracking-[-0.025em]">{topic}</h2>
          <div className="border-l-[3px] border-olive bg-olive-tint px-4 py-3">
            <Label className="!text-olive-ink">Where to apply it</Label>
            <p className="mt-1 font-serif text-[16px] leading-relaxed">{c.whereToApply}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>The rule</Label>
            <p className="font-serif text-[18px] leading-normal">{c.rule}</p>
          </div>
          <Examples items={c.examples} />
          <div className="flex flex-col gap-2 border-l-[3px] border-ink bg-soft px-4 py-3.5">
            <Label className="!text-graphite">The common mistake</Label>
            <p className="flex items-start gap-2 font-serif text-[15px] text-graphite"><Icon.cross size={15} className="mt-1 shrink-0" /><span className="line-through">{c.mistake.wrong}</span></p>
            <p className="flex items-start gap-2 font-serif text-[15px]"><Icon.check size={15} className="mt-1 shrink-0 text-olive-ink" />{c.mistake.right}</p>
            <p className="text-[12.5px] leading-relaxed text-graphite">{c.mistake.why}</p>
          </div>
          <div className="flex flex-col gap-3 border-t border-rule pt-4">
            <Label>Quick check</Label>
            <Check mcq={c.practice} onAnswer={(right) => record(tag, right)} />
          </div>

          <MemoryHook key={`hook-${topic}`} topic={topic} rule={c.rule} />

          {seed == null ? (
            <Btn variant="quiet" className="w-fit" onClick={() => setSeed(Math.floor(Math.random() * 1e6))}>Another check · AI</Btn>
          ) : (
            <div className="flex flex-col gap-3 border border-dashed border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <Label>Fresh examples &amp; check</Label>
                <Tag>AI</Tag>
              </div>
              {fresh.status === "error" ? (
                <ErrorPanel compact error={fresh.error} onRetry={fresh.retry} />
              ) : !fresh.data ? (
                <Skeleton title={false} lines={4} />
              ) : (
                <>
                  <Examples items={fresh.data.examples} />
                  <Check key={seed} mcq={fresh.data.practice} onAnswer={(right) => record(tag, right)} />
                  <Btn variant="quiet" className="w-fit" onClick={() => setSeed(Math.floor(Math.random() * 1e6))}>Another one</Btn>
                </>
              )}
            </div>
          )}
        </article>
        <div className="flex gap-2">
          <Btn variant="quiet" size="lg" className="w-[52px] !px-0" aria-label="Previous topic" onClick={() => go(i - 1)}><Icon.left /></Btn>
          <Btn variant="ink" size="lg" className="flex-1" onClick={() => go(i + 1)}>Next topic</Btn>
        </div>
        <Source>Rule, examples, mistake &amp; first check · curated · Fresh examples &amp; checks · written by AI</Source>
      </div>
    </div>
  );
}

/** The PRD's mnemonic button: a memory hook for the rule, on demand. */
function MemoryHook({ topic, rule }: { topic: string; rule: string }) {
  const [on, setOn] = useSessionState(`hook:${topic}`, false);
  const hook = useAsync(on ? `rule-hook:${topic}` : null, () => ai("mnemonic", { term: topic, definition: rule }));
  if (!on)
    return (
      <Btn variant="quiet" className="w-fit" onClick={() => setOn(true)}>
        <Icon.bulb size={15} /> Memory hook · AI
      </Btn>
    );
  return (
    <div className="pop flex flex-col gap-1.5 border-l-[3px] border-olive bg-olive-tint px-4 py-3">
      <Label className="!text-olive-ink">Memory hook · AI</Label>
      {hook.status === "error" ? (
        <ErrorPanel compact error={hook.error} onRetry={hook.retry} />
      ) : !hook.data ? (
        <div className="flex flex-col gap-2"><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-2/3" /></div>
      ) : (
        <p className="font-serif text-[15.5px] leading-relaxed">{hook.data.hook}</p>
      )}
    </div>
  );
}

function Examples({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-2 border-l-2 border-olive-line pl-3.5">
      {items.map((ex) => (
        <div key={ex} className="flex items-start gap-1">
          <p className="flex-1 font-serif text-[15.5px] leading-relaxed text-graphite">{ex}</p>
          <SpeakBtn variant="inline" text={ex} />
        </div>
      ))}
    </div>
  );
}

// ================================================================== practice run
function Practice({ topics, kind }: { topics: string[]; kind: Kind }) {
  const { record } = useStore();
  const [order, setOrder] = useSessionState(`${kind}:practice:order`, () => shuffle(topics).slice(0, 8));
  const [seed, setSeed] = useSessionState(`${kind}:practice:seed`, () => Math.floor(Math.random() * 1e6));
  const [i, setI] = useSessionState(`${kind}:practice:i`, 0);
  const [picked, setPicked] = useSessionState<number | null>(`${kind}:practice:picked`, null);
  const [score, setScore] = useSessionState(`${kind}:practice:score`, 0);
  const [look, setLook] = useState(false);
  const topic = order[i] ?? null;
  // A fresh AI question for each topic; the curated check stands in if the model is slow.
  const fresh = useFreshCheck(topic, kind, seed, 8_000);
  const upNext = order[i + 1] ?? null;
  const warm = useFreshCheck(upNext, kind, fresh.status === "loading" ? null : seed, 8_000);
  void warm; // prefetch only
  const mcq: MCQ | null = !topic ? null : fresh.data ? fresh.data.practice : fresh.status === "error" ? lessonFor(topic).practice : null;
  const done = i >= order.length;
  const restart = () => { setOrder(shuffle(topics).slice(0, 8)); setSeed(Math.floor(Math.random() * 1e6)); setI(0); setScore(0); setPicked(null); };

  function answer(idx: number) {
    if (!mcq || picked != null || idx >= mcq.options.length) return;
    setPicked(idx);
    if (idx === mcq.answer) setScore((s) => s + 1);
    record(`${kind === "grammar" ? "grammar" : "punct"}:${topic}`, idx === mcq.answer);
  }
  function next() {
    if (picked == null || done) return;
    setI(i + 1);
    setPicked(null);
    setLook(false);
  }
  useChoiceKeys((k) => ("pick" in k ? answer(k.pick) : next()));

  if (done)
    return (
      <div className="pop flex flex-col items-start gap-4 border border-ink bg-card p-8">
        <Label>Practice complete</Label>
        <span className="text-[56px] leading-none font-medium tracking-[-0.04em]">{score}<span className="text-muted">/{order.length}</span></span>
        <p className="font-serif text-[16px] text-graphite">Missed ones are worth a look in Cards mode — each has the rule, the common mistake and where it matters.</p>
        <Btn variant="primary" onClick={restart}>New practice set</Btn>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between"><span className="text-[12px] font-medium">Question {i + 1} of {order.length}</span><span className="text-[11px] text-muted">Score {score}</span></div>
        <Progress value={i / order.length} />
      </div>
      <div className="flex flex-col gap-4 border border-rule bg-card p-5 sm:p-7">
        <Label>{topic}</Label>
        {!mcq ? (
          <Skeleton title={false} lines={4} />
        ) : (
          <>
            <p className="font-serif text-[18px] leading-snug">{mcq.question}</p>
            <div className="flex flex-col gap-2">
              {mcq.options.map((o, idx) => (
                <OptionButton key={o} index={idx} text={o} picked={picked} answer={mcq.answer} onPick={() => answer(idx)} />
              ))}
            </div>
            {picked != null && (
              <>
                <Explanation right={picked === mcq.answer} text={mcq.why} />
                {!look ? (
                  <button type="button" onClick={() => setLook(true)} className="tap w-fit text-[12px] font-medium text-olive-ink hover:underline">Show the rule</button>
                ) : (
                  <p className="pop bg-soft px-3.5 py-2.5 font-serif text-[15px] leading-relaxed">{lessonFor(topic!).rule}</p>
                )}
              </>
            )}
          </>
        )}
      </div>
      <Btn variant="ink" size="lg" disabled={picked == null} onClick={next}>
        {i + 1 === order.length ? "Finish" : "Next question"}
      </Btn>
      <Source>{fresh.status === "error" ? "Curated check (the AI was slow or unreachable)" : "Questions written by AI, checked for exactly one right option · Rules · curated"}</Source>
    </div>
  );
}
