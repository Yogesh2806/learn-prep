"use client";

import { useState, type ReactNode } from "react";
import { ai } from "@/lib/ai";
import type { AiOut } from "@/lib/ai-types";
import { confusionChecks, mergeMatches } from "@/lib/confusions";
import { applyFixes, checkText, highlight, type LTMatch } from "@/lib/languagetool";
import { CHALLENGES, currentLevel, loadWriting, nextChallenge, PROMPTS, saveScore, type WritingProgress } from "@/lib/writing";
import { useStore } from "../store";
import { Btn, ErrorPanel, Icon, Label, Source, SpeakBtn, Tag, useSessionState } from "../ui";

// Writing Arena: write → the checker finds objective errors (LanguageTool + the on-device
// their/they're check) → the AI scores it, gives targeted notes and a cleaner rewrite.
// If the AI is down you still get the errors and a checker-corrected version.

type Grade = AiOut<"writing-grade">;
type Result = { text: string; matches: LTMatch[]; grade: Grade | null; aiError?: unknown; checkError?: unknown };

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function WritingArena({ mode }: { mode: "challenge" | "free" }) {
  const { record, award } = useStore();
  const [progress, setProgress] = useState<WritingProgress>(loadWriting);
  const level = currentLevel(progress);

  const [challengeId, setChallengeId] = useSessionState("arena:challenge", () => nextChallenge(progress, level).id);
  const [promptIdx, setPromptIdx] = useSessionState("arena:prompt", () => Math.floor(Math.random() * PROMPTS.length));
  const [draft, setDraft] = useSessionState(`arena:draft:${mode}`, "");
  const [result, setResult] = useSessionState<Result | null>(`arena:result:${mode}`, null);
  const [busy, setBusy] = useState<null | "checking" | "grading">(null);

  const challenge = CHALLENGES.find((c) => c.id === challengeId) ?? CHALLENGES[0];
  const isChallenge = mode === "challenge";

  async function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setResult(null);
    setBusy("checking");
    let matches: LTMatch[] = [];
    let checkError: unknown;
    try {
      matches = mergeMatches(await checkText(text), confusionChecks(text));
    } catch (e) {
      checkError = e; // grade anyway — the AI can still help
    }
    setResult({ text, matches, grade: null, checkError });
    setBusy("grading");
    try {
      const r = await ai("writing-grade", {
        mode: isChallenge ? "rewrite" : "free",
        original: isChallenge ? challenge.text : null,
        text,
        issues: matches.slice(0, 15).map((m) => ({ text: m.text || "(missing)", suggestion: m.replacements[0] ?? "—", rule: m.message })),
      });
      const g = r.value;
      setResult({ text, matches, grade: g, checkError });
      setProgress((p) => saveScore(p, isChallenge ? challenge.id : `free-${promptIdx}`, g.score));
      record("writing", g.score >= 70, 0);
      award(Math.round(g.score / 5)); // up to 20 XP
    } catch (e) {
      setResult({ text, matches, grade: null, aiError: e, checkError });
    } finally {
      setBusy(null);
    }
  }

  function next() {
    setResult(null);
    setDraft("");
    if (isChallenge) setChallengeId(nextChallenge(progress, currentLevel(progress), challenge.id).id);
    else setPromptIdx((promptIdx + 1) % PROMPTS.length);
  }

  const best = isChallenge ? progress.scores.filter((s) => s.id === challenge.id).reduce((m, s) => Math.max(m, s.score), -1) : -1;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-[22px] font-medium tracking-[-0.02em]">Writing Arena</h1>
          <div className="flex gap-1.5">
            {isChallenge ? <Tag tone="olive">Rewrite challenge</Tag> : <Tag tone="olive">Free writing</Tag>}
            {isChallenge && <Tag>{challenge.level}</Tag>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border border-rule bg-card px-4 py-3.5">
          <Label>{isChallenge ? "Make this less awkward" : "Your prompt"}</Label>
          <div className="flex items-start gap-1">
            <p className="flex-1 font-serif text-[16px] leading-normal text-graphite">{isChallenge ? challenge.text : PROMPTS[promptIdx]}</p>
            {isChallenge && <SpeakBtn variant="inline" text={challenge.text} label="Hear the sentence" />}
          </div>
          {isChallenge && best >= 0 && <span className="text-[11px] text-muted">Your best: {best}/100</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="arena-draft" className="label-caps">Your version</label>
          {result && !busy ? (
            <button
              type="button"
              onClick={() => setResult(null)}
              className="tap min-h-[84px] rounded-[4px] border border-line bg-card px-3.5 py-3 text-left font-serif text-[16px] leading-relaxed"
              aria-label="Edit your text"
            >
              {highlight(result.text, result.matches).map((s, n) => (s.hit ? <span key={n} className="border-b-2 border-ink">{s.text || "·"}</span> : <span key={n}>{s.text}</span>))}
            </button>
          ) : (
            <textarea
              id="arena-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              disabled={!!busy}
              rows={isChallenge ? 3 : 6}
              maxLength={1200}
              placeholder={isChallenge ? "Rewrite it in your own words…" : "Start writing…"}
              className="min-h-[84px] w-full resize-y rounded-[4px] border border-line bg-card px-3.5 py-3 font-serif text-[16px] leading-relaxed outline-none focus:border-olive"
            />
          )}
          <span className="text-[11px] text-muted">
            {words(result?.text ?? draft)} words
            {result && !result.checkError ? ` · ${result.matches.length} issue${result.matches.length === 1 ? "" : "s"} found` : ""}
            {!result && " · ⌘/Ctrl + Enter to check"}
          </span>
        </div>

        {!result && (
          <Btn variant="primary" size="lg" disabled={!draft.trim() || !!busy} onClick={submit}>
            {busy === "checking" ? "Checking…" : busy === "grading" ? "Scoring…" : "Check my writing"}
          </Btn>
        )}

        {result && <Feedback result={result} grading={busy === "grading"} onRetry={submit} />}

        {result && !busy && (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="strong" size="lg" onClick={() => { setDraft(result.text); setResult(null); }}>Try again</Btn>
            <Btn variant="primary" size="lg" onClick={next}>{isChallenge ? "Next challenge" : "New prompt"}</Btn>
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 border-t border-ink pt-3">
          <Label>How it works</Label>
          <p className="font-serif text-[14.5px] leading-relaxed text-graphite">
            A grammar checker marks objective errors. Then the AI scores clarity and concision, says what worked and what to fix, and shows a cleaner version of <em>your</em> text.
          </p>
        </div>
        {isChallenge && (
          <div className="flex flex-col gap-2 border border-rule bg-card p-4">
            <Label>Your level</Label>
            <span className="text-[15px] font-medium capitalize">{level}</span>
            <p className="text-[12px] leading-snug text-muted">
              {level === "advanced" ? "You're on the harder set: modifiers, parallelism, tone." : "Average 80+ on three challenges in a row to move up to the advanced set."}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Feedback({ result, grading, onRetry }: { result: Result; grading: boolean; onRetry: () => void }) {
  const g = result.grade;
  const corrected = applyFixes(result.text, result.matches);
  return (
    <div className="pop flex flex-col gap-4 border border-ink bg-card p-5 sm:p-6">
      {g ? (
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-[44px] leading-none font-medium tracking-[-0.035em] tabular-nums">{g.score}</span>
            <span className="text-[15px] text-muted">/100</span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[14px] font-medium">{g.headline}</span>
            <div className="h-[3px] bg-line"><div className="h-full bg-olive" style={{ width: `${g.score}%` }} /></div>
          </div>
        </div>
      ) : grading ? (
        <div className="flex flex-col gap-2"><div className="skeleton h-10 w-40" /><span className="text-[12px] text-muted">Scoring your writing…</span></div>
      ) : (
        <ErrorPanel compact error={result.aiError} onRetry={onRetry} />
      )}

      {(g?.points.length || result.matches.length > 0) && <div className="h-px bg-rule" />}

      <div className="flex flex-col gap-2.5">
        {g?.points.filter((p) => p.good).map((p) => <Point key={p.note} good text={p.note} />)}
        {result.matches.map((m, n) => (
          <Point key={`m${n}`} good={false} text={<><span className="font-medium text-ink">{m.text || "(missing)"}</span>{m.replacements[0] ? <> → {m.replacements[0]}</> : null}. {m.short || m.message}</>} />
        ))}
        {g?.points.filter((p) => !p.good && !repeatsChecker(p.note, result.matches)).map((p) => <Point key={p.note} good={false} text={p.note} />)}
        {!g && !grading && !result.matches.length && !result.checkError && <Point good text="The checker found no grammar, spelling or punctuation errors." />}
      </div>

      {(g || result.matches.length > 0) && (
        <div className="flex flex-col gap-1 border-l-[3px] border-olive bg-olive-tint px-4 py-3">
          <Label className="!text-olive-ink">{g ? "A cleaner version" : "Corrected by the checker"}</Label>
          <div className="flex items-start gap-1">
            <p className="flex-1 font-serif text-[16px] leading-normal">{g ? g.rewrite : corrected}</p>
            <SpeakBtn variant="inline" text={g ? g.rewrite : corrected} label="Hear the cleaner version" />
          </div>
        </div>
      )}

      <Source>
        Errors · LanguageTool{result.matches.some((m) => m.rule.startsWith("LOCAL_")) ? " + on-device check" : ""}
        {result.checkError ? " (unreachable)" : ""} · Score, notes &amp; rewrite · {g ? "AI" : grading ? "AI (working…)" : "AI unavailable right now"}
      </Source>
    </div>
  );
}

/** The checker's errors are listed already; skip AI notes that only re-flag one of them. */
function repeatsChecker(note: string, matches: LTMatch[]) {
  const n = note.toLowerCase();
  return matches.some((m) => m.text.trim().length >= 3 && n.includes(m.text.trim().toLowerCase()) && /spell|typo|apostrophe/.test(n));
}

function Point({ good, text }: { good: boolean; text: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      {good ? <Icon.check size={14} className="mt-0.5 shrink-0 text-olive-ink" /> : <Icon.cross size={14} className="mt-0.5 shrink-0" />}
      <span className="text-[13.5px] leading-snug text-graphite">{text}</span>
    </div>
  );
}
