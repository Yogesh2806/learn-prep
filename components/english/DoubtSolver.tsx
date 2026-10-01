"use client";

import { useEffect, useRef, useState } from "react";
import { ai } from "@/lib/ai";
import { openSettings } from "@/lib/ai-settings";
import { AiError } from "@/lib/engines/errors";
import { confusionChecks, mergeMatches } from "@/lib/confusions";
import { applyFixes, checkText, highlight, type LTMatch } from "@/lib/languagetool";
import { cx } from "@/lib/utils";
import { useStore } from "../store";
import { ErrorPanel, Icon, Label, Source, SpeakBtn } from "../ui";

// A sentence gets checked by LanguageTool (objective errors with offsets) and each
// error explained in plain English by the teaching layer. A question goes straight to
// the teaching layer. The session history lives in sessionStorage only.

type Turn =
  | { id: number; kind: "sentence"; text: string; status: "loading" | "done" | "error"; matches?: LTMatch[]; notes?: string[]; tip?: string; corrected?: string; error?: unknown; explainFailed?: boolean; noEngine?: boolean; via?: string }
  | { id: number; kind: "question"; text: string; status: "loading" | "done" | "error"; answer?: string; examples?: string[]; onTopic?: boolean; error?: unknown; via?: string };

const QUESTION_START = /^(what|why|how|when|where|which|who|whom|whose|is|are|am|can|could|should|would|do|does|did|will|shall|may|might|must|difference|explain|meaning|define)\b/i;
export const looksLikeQuestion = (t: string) => t.trim().endsWith("?") && QUESTION_START.test(t.trim()) || /^(what|why|how|explain|difference|define|meaning)\b/i.test(t.trim());

const KEY = "lp.doubt.session";
const SUGGESTIONS = ["Affect or effect — which one is the verb?", "When do I use “whom” instead of “who”?", "Their going to the office tommorow, arent they?", "What's the difference between “fewer” and “less”?"];

export default function DoubtSolver() {
  const { studied } = useStore();
  const [turns, setTurns] = useState<Turn[]>(() => {
    try {
      return (JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as Turn[]).filter((t) => t.status === "done");
    } catch {
      return [];
    }
  });
  const [text, setText] = useState("");
  const [forced, setForced] = useState<null | "sentence" | "question">(null);
  const end = useRef<HTMLDivElement>(null);
  const nextId = useRef(turns.reduce((m, t) => Math.max(m, t.id), 0) + 1);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(turns.slice(-12)));
    } catch {
      /* ignore */
    }
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const detected = text.trim() ? (looksLikeQuestion(text) ? "question" : "sentence") : null;
  const kind = forced ?? detected;

  const patch = (id: number, p: Partial<Turn>) => setTurns((ts) => ts.map((t) => (t.id === id ? ({ ...t, ...p } as Turn) : t)));

  async function run(t: Turn) {
    if (t.kind === "question") {
      const history = turns.filter((x): x is Extract<Turn, { kind: "question" }> => x.kind === "question" && x.status === "done" && !!x.answer).slice(-3).map((x) => ({ q: x.text, a: x.answer! }));
      try {
        const r = await ai("doubt-answer", { question: t.text, history }, { cacheKey: `${t.text}::${history.map((h) => h.q).join("|")}` });
        patch(t.id, { status: "done", ...r.value, via: r.via });
      } catch (e) {
        patch(t.id, { status: "error", error: e });
      }
      return;
    }
    let matches: LTMatch[];
    try {
      matches = mergeMatches(await checkText(t.text), confusionChecks(t.text));
    } catch (e) {
      patch(t.id, { status: "error", error: e });
      return;
    }
    const corrected = applyFixes(t.text, matches);
    if (!matches.length) {
      patch(t.id, { status: "done", matches, corrected });
      return;
    }
    patch(t.id, { matches, corrected }); // show the checker's findings immediately…
    try {
      const r = await ai("explain-corrections", { sentence: t.text, issues: matches.map((m) => ({ text: m.text || "(missing)", suggestion: m.replacements[0] ?? "—", rule: m.message })) });
      patch(t.id, { status: "done", notes: r.value.notes, tip: r.value.tip, via: r.via }); // …then the plain-English "why"
    } catch (e) {
      patch(t.id, { status: "done", explainFailed: true, noEngine: e instanceof AiError && e.kind === "setup" });
    }
  }

  function submit(value = text) {
    const v = value.trim();
    if (!v) return;
    const k = forced ?? (looksLikeQuestion(v) ? "question" : "sentence");
    const t = { id: nextId.current++, kind: k, text: v, status: "loading" } as Turn;
    setTurns((ts) => [...ts, t]);
    setText("");
    setForced(null);
    studied();
    void run(t);
  }

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-[19px] font-medium tracking-[-0.015em]">Doubt Solver</h1>
        <span className="text-[11px] text-muted">Paste a sentence or ask anything</span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {turns.length === 0 && (
          <div className="flex flex-col gap-2.5 border border-dashed border-line bg-card p-5">
            <Label>Try one</Label>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => submit(s)} className="tap press w-fit rounded-full border border-line bg-card px-3.5 py-2 text-left text-[13px] text-graphite hover:border-muted hover:text-ink">{s}</button>
            ))}
          </div>
        )}
        {turns.map((t) => (
          <div key={t.id} className="flex flex-col gap-2.5">
            <div className="max-w-[86%] self-end rounded-[4px] border border-rule bg-soft px-3.5 py-2.5">
              <p className="font-serif text-[15px] leading-relaxed">{t.text}</p>
            </div>
            <TurnView turn={t} onRetry={() => { patch(t.id, { status: "loading", error: undefined }); void run({ ...t, status: "loading" } as Turn); }} onAskWhy={(q) => submit(q)} />
          </div>
        ))}
        <div ref={end} />
      </div>

      <div className="sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-rule bg-paper/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
        {kind && (
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span>Treat as:</span>
            {(["sentence", "question"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setForced(k)} aria-pressed={kind === k}
                className={cx("tap rounded-full border px-2.5 py-1 capitalize", kind === k ? "border-ink bg-ink text-on-ink" : "border-line text-graphite")}>
                {k === "sentence" ? "Check my sentence" : "Answer my question"}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <label htmlFor="doubt" className="sr-only">Ask a question or paste a sentence</label>
          <textarea
            id="doubt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Ask anything, or paste a sentence…"
            className="max-h-40 min-h-[52px] min-w-0 flex-1 resize-none rounded-[4px] border border-line bg-card px-3.5 py-3.5 text-[15px] leading-snug outline-none focus:border-olive"
          />
          <button type="button" onClick={() => submit()} disabled={!text.trim()} aria-label="Send"
            className="tap press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[4px] border border-olive bg-olive text-on-olive disabled:opacity-40">
            <Icon.send size={19} />
          </button>
        </div>
        <p className="text-[10px] text-muted">Card shortcuts pause while you type here · Don&apos;t paste anything private — questions go to Google&apos;s Gemini API.</p>
      </div>
    </div>
  );
}

function TurnView({ turn, onRetry, onAskWhy }: { turn: Turn; onRetry: () => void; onAskWhy: (q: string) => void }) {
  if (turn.status === "error") return <ErrorPanel compact error={turn.error} onRetry={onRetry} />;

  if (turn.kind === "question") {
    if (turn.status === "loading") return <Thinking label="Thinking it through…" />;
    return (
      <div className="pop flex flex-col gap-3 border border-rule bg-card p-4">
        <p className="font-serif text-[16px] leading-relaxed whitespace-pre-line">{turn.answer}</p>
        {!!turn.examples?.length && (
          <div className="flex flex-col gap-1.5 border-l-2 border-olive-line pl-3">
            {turn.examples.map((e) => (
              <div key={e} className="flex items-start gap-1">
                <p className="flex-1 font-serif text-[15px] text-graphite">{e}</p>
                <SpeakBtn variant="inline" text={e} />
              </div>
            ))}
          </div>
        )}
        <Source>Answer written by AI{turn.via ? ` · ${turn.via}` : ""}</Source>
      </div>
    );
  }

  // sentence
  if (!turn.matches) return <Thinking label="Checking grammar, spelling and punctuation…" />;
  if (!turn.matches.length)
    return (
      <div className="pop flex flex-col gap-2 border-l-[3px] border-olive bg-olive-tint px-4 py-3">
        <span className="label-caps flex items-center gap-1.5 !text-olive-ink"><Icon.check size={12} /> No issues found</span>
        <p className="text-[13px] text-graphite">LanguageTool found nothing to fix. Want to know why it works?</p>
        <button type="button" onClick={() => onAskWhy(`Is this sentence correct and natural, and why? "${turn.text}"`)} className="tap w-fit text-[12px] font-medium text-olive-ink hover:underline">Ask why it&apos;s right →</button>
      </div>
    );

  const spans = highlight(turn.text, turn.matches);
  return (
    <div className="pop flex flex-col gap-3.5 border border-rule bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="label-caps">{turn.matches.length} thing{turn.matches.length === 1 ? "" : "s"} to fix</span>
        <div className="h-px flex-1 bg-rule" />
      </div>
      <p className="font-serif text-[16px] leading-[1.75] text-graphite">
        {spans.map((s, i) => (s.hit ? <span key={i} className="border-b-2 border-ink text-ink">{s.text || "·"}</span> : <span key={i}>{s.text}</span>))}
      </p>
      <ol className="flex flex-col gap-2.5">
        {turn.matches.map((m, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="w-3 shrink-0 pt-0.5 text-[11px] text-muted">{i + 1}</span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px]">
                <span className="text-muted line-through">{m.text || "(missing)"}</span>
                {m.replacements[0] != null && <> &nbsp;→&nbsp; <span className="font-medium text-olive-ink">{m.replacements[0] || "(remove)"}</span></>}
              </span>
              <span className="text-[12.5px] leading-relaxed text-graphite">
                {turn.notes?.[i] ?? (turn.status === "loading" ? <span className="skeleton inline-block h-3 w-48 align-middle" /> : m.message)}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {turn.corrected && turn.corrected !== turn.text && (
        <div className="flex flex-col gap-1 border-l-[3px] border-olive bg-olive-tint px-3.5 py-3">
          <Label className="!text-olive-ink">Corrected</Label>
          <div className="flex items-start gap-1">
            <p className="flex-1 font-serif text-[16px] leading-relaxed">{turn.corrected}</p>
            <SpeakBtn variant="inline" text={turn.corrected} />
          </div>
        </div>
      )}
      {turn.tip && <p className="text-[12.5px] text-graphite"><span className="font-medium text-ink">Remember:</span> {turn.tip}</p>}
      {turn.noEngine && (
        <button type="button" onClick={openSettings} className="tap w-fit text-[12px] font-medium text-olive-ink hover:underline">
          Set up AI in Settings for plain-English explanations →
        </button>
      )}
      <Source>
        Errors · LanguageTool{turn.matches.some((m) => m.rule.startsWith("LOCAL_")) ? " + an on-device their/they're check" : ""}
        {turn.noEngine ? "" : turn.explainFailed ? " (plain-English explanations unavailable right now)" : ` · Explanations written by AI${turn.via ? ` · ${turn.via}` : ""}`}
      </Source>
    </div>
  );
}

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2 border border-rule bg-card p-4" aria-busy="true">
      <span className="text-[12px] text-muted">{label}</span>
      <div className="skeleton h-3.5 w-full" />
      <div className="skeleton h-3.5 w-2/3" />
    </div>
  );
}
