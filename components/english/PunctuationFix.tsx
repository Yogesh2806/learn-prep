"use client";

import { useState } from "react";
import { ai } from "@/lib/ai";
import { PUNCTUATION_TOPICS } from "@/lib/english-data";
import { PUNCT_FALLBACK } from "@/lib/english-lessons";
import { checkText, type LTMatch } from "@/lib/languagetool";
import { describeError } from "@/lib/net";
import { cx, shuffle } from "@/lib/utils";
import { useStore } from "../store";
import { Btn, Chip, ErrorPanel, Icon, Label, Progress, Skeleton, Source, useAsync, useSessionState, useToast } from "../ui";

// "Fix the punctuation": edit the broken sentence in place. An exact match with the
// expected fix is right; anything else is checked by LanguageTool, so a valid
// alternative punctuation isn't marked wrong just for differing from the key.

const normalise = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();

type Verdict = { kind: "exact" | "clean" | "issues" | "check-failed"; matches?: LTMatch[]; error?: unknown };

export default function PunctuationFix() {
  const { record } = useStore();
  const toast = useToast();
  const [topic, setTopic] = useSessionState<string>("pfix:topic", PUNCTUATION_TOPICS[0]);
  const [seed, setSeed] = useSessionState("pfix:seed", () => Math.floor(Math.random() * 1e6));
  const set = useAsync(`punct:${topic}:${seed}`, async () => {
    try {
      const r = await ai("punct-drills", { topic, seed }, { cacheKey: `${topic}:${seed}`, quick: 12_000 });
      return { value: { items: r.value.items, saved: false }, stale: r.stale };
    } catch (e) {
      // Model slow or down: hand-checked items for this topic.
      const saved = PUNCT_FALLBACK[topic as keyof typeof PUNCT_FALLBACK];
      if (!saved) throw e;
      return { value: { items: shuffle(saved), saved: true }, stale: false };
    }
  });
  const [i, setI] = useSessionState("pfix:i", 0);
  const [text, setText] = useSessionState<string | null>("pfix:text", null);
  const [verdict, setVerdict] = useSessionState<Verdict | null>("pfix:verdict", null);
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useSessionState("pfix:score", 0);

  const items = set.data?.items ?? [];
  const item = items[i];
  const value = text ?? item?.broken ?? "";

  function pick(t: string) {
    setTopic(t);
    setSeed(Math.floor(Math.random() * 1e6));
    reset(0);
  }
  function reset(n: number) {
    setI(n);
    setText(null);
    setVerdict(null);
  }

  async function check() {
    if (!item || verdict || checking) return;
    const tag = `punct:${topic}`;
    if (normalise(value) === normalise(item.fixed)) {
      setVerdict({ kind: "exact" });
      setScore((s) => s + 1);
      record(tag, true);
      return;
    }
    setChecking(true);
    try {
      const matches = (await checkText(value)).filter((m) => m.category.toLowerCase().includes("punct") || m.type === "typographical" || /comma|apostrophe|hyphen|colon|semicolon|dash|quot|capital/i.test(m.message));
      setVerdict(matches.length ? { kind: "issues", matches } : { kind: "clean" });
      if (!matches.length) setScore((s) => s + 1);
      record(tag, !matches.length);
    } catch (e) {
      setVerdict({ kind: "check-failed", error: e });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="no-bar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
        {PUNCTUATION_TOPICS.map((t) => (
          <Chip key={t} active={t === topic} onClick={() => pick(t)}>{t}</Chip>
        ))}
      </div>

      {set.status === "error" ? (
        <ErrorPanel error={set.error} onRetry={set.retry} />
      ) : !set.data ? (
        <div className="border border-rule bg-card p-6"><Skeleton title={false} lines={4} /></div>
      ) : !item ? (
        <div className="pop flex flex-col items-start gap-4 border border-ink bg-card p-8">
          <Label>Set complete</Label>
          <span className="text-[56px] leading-none font-medium tracking-[-0.04em]">{score}<span className="text-muted">/{items.length}</span></span>
          <Btn variant="primary" onClick={() => { setSeed(Math.floor(Math.random() * 1e6)); setScore(0); reset(0); }}>4 more on this</Btn>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-[7px]">
            <div className="flex items-baseline justify-between"><span className="text-[12px] font-medium">Sentence {i + 1} of {items.length}</span><span className="text-[11px] text-muted">Score {score}</span></div>
            <Progress value={i / items.length} />
          </div>
          <div className="flex flex-col gap-4 border border-ink bg-card p-5 sm:p-7">
            <Label>Fix the punctuation — edit it right here</Label>
            <label htmlFor="punct-edit" className="sr-only">Sentence to correct</label>
            <textarea
              id="punct-edit"
              value={value}
              onChange={(e) => setText(e.target.value)}
              disabled={!!verdict}
              rows={3}
              spellCheck={false}
              className="resize-none rounded-[4px] border border-line bg-paper px-4 py-3 font-serif text-[18px] leading-relaxed outline-none focus:border-olive"
            />
            {!verdict && (
              <button type="button" onClick={() => setText(null)} className="tap w-fit text-[12px] text-muted hover:text-ink">Reset to the original</button>
            )}

            {verdict && (
              <div className={cx("pop flex flex-col gap-2 border-l-[3px] px-4 py-3", verdict.kind === "exact" || verdict.kind === "clean" ? "border-olive bg-olive-tint" : "border-ink bg-soft")}>
                <span className={cx("label-caps flex items-center gap-1.5", verdict.kind === "exact" || verdict.kind === "clean" ? "!text-olive-ink" : "!text-ink")}>
                  {verdict.kind === "exact" || verdict.kind === "clean" ? <Icon.check size={12} /> : <Icon.cross size={12} />}
                  {verdict.kind === "exact" ? "Exactly right" : verdict.kind === "clean" ? "Correct — a valid alternative" : verdict.kind === "issues" ? "Not quite" : "Couldn't check your version"}
                </span>
                {verdict.kind === "issues" && verdict.matches!.map((m, k) => (
                  <p key={k} className="text-[13px] leading-relaxed text-graphite"><span className="font-medium text-ink">“{m.text}”</span> — {m.message}</p>
                ))}
                {verdict.kind === "check-failed" && <p className="text-[13px] text-graphite">{describeError(verdict.error).body}</p>}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted">{verdict.kind === "exact" ? "The rule" : "Expected"}</span>
                  {verdict.kind !== "exact" && <p className="font-serif text-[16px]">{item.fixed}</p>}
                  <p className="text-[12.5px] leading-relaxed text-graphite">{item.why}</p>
                </div>
                {(verdict.kind === "issues" || verdict.kind === "check-failed") && (
                  <button type="button" onClick={() => { setVerdict({ kind: "clean" }); setScore((s) => s + 1); toast("Counted as correct"); }} className="tap press w-fit rounded-[4px] border border-line bg-card px-3 py-2 text-[12px] font-medium text-graphite hover:text-ink">
                    Mine is correct too
                  </button>
                )}
              </div>
            )}
          </div>
          {!verdict ? (
            <Btn variant="primary" size="lg" disabled={checking} onClick={check}>{checking ? "Checking…" : "Check"}</Btn>
          ) : (
            <Btn variant="ink" size="lg" onClick={() => reset(i + 1)}>{i + 1 === items.length ? "Finish set" : "Next sentence"}</Btn>
          )}
          <Source>{set.data?.saved ? "Saved, hand-checked sentences (the AI was slow or unreachable)" : "Sentences written by AI and verified to differ only in punctuation"} · Your alternatives checked by LanguageTool</Source>
        </>
      )}
    </div>
  );
}
