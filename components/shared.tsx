"use client";

import { useEffect, useEffectEvent, type ReactNode } from "react";
import { cx, isTypingTarget } from "@/lib/utils";
import { Btn, Icon, Label } from "./ui";

/** Keys for any multiple-choice screen: 1–9 pick an option, Enter moves on. */
export function useChoiceKeys(onKey: (k: { pick: number } | { next: true }) => void) {
  // useEffectEvent: always sees the latest state, without re-subscribing the listener.
  const handle = useEffectEvent((e: KeyboardEvent) => {
    if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key)) onKey({ pick: Number(e.key) - 1 });
    else if (e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "BUTTON") onKey({ next: true });
  });
  useEffect(() => {
    const on = (e: KeyboardEvent) => handle(e);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
}

/** One multiple-choice option. Right/wrong is carried by icon and lightness, not hue alone. */
export function OptionButton({ index, text, picked, answer, onPick }: { index: number; text: string; picked: number | null; answer: number; onPick: () => void }) {
  const done = picked != null;
  const isAnswer = index === answer;
  const isPicked = index === picked;
  const state = !done ? "idle" : isAnswer ? "right" : isPicked ? "wrong" : "dim";
  return (
    <button
      type="button"
      disabled={done}
      onClick={onPick}
      className={cx(
        "tap press flex min-h-[50px] w-full items-center gap-3 rounded-[4px] border px-4 py-3 text-left text-[14.5px] leading-snug",
        state === "idle" && "border-line bg-card text-graphite hover:border-ink hover:text-ink",
        state === "right" && "border-olive bg-olive font-medium text-on-olive",
        state === "wrong" && "nudge border-ink bg-soft font-medium text-ink",
        state === "dim" && "border-rule bg-card text-muted opacity-60",
      )}
    >
      <span className="grid w-4 shrink-0 place-items-center text-[11px] tabular-nums opacity-70">
        {state === "right" ? <Icon.check size={16} /> : state === "wrong" ? <Icon.cross size={16} /> : index + 1}
      </span>
      <span className="flex-1">{text}</span>
      {state === "wrong" && <span className="label-caps !text-graphite">Yours</span>}
      {state === "right" && <span className="label-caps !text-on-olive opacity-90">Correct</span>}
    </button>
  );
}

export function Explanation({ right, text, label }: { right: boolean; text: string; label?: string }) {
  return (
    <div className={cx("pop flex flex-col gap-1 border-l-[3px] px-4 py-3", right ? "border-olive bg-olive-tint" : "border-ink bg-soft")}>
      <span className={cx("label-caps flex items-center gap-1.5", right ? "!text-olive-ink" : "!text-ink")}>
        {right ? <Icon.check size={12} /> : <Icon.cross size={12} />} {label ?? (right ? "Correct" : "Not quite")}
      </span>
      <p className="font-serif text-[15px] leading-relaxed">{text}</p>
    </div>
  );
}

export function Results({
  pct,
  line,
  best,
  note,
  retryLabel,
  onRetry,
  onRestart,
  review,
  reviewTitle = "What to review",
  extra,
}: {
  pct: number;
  line: string;
  best: string | null;
  note: string;
  retryLabel: string;
  onRetry?: () => void;
  onRestart: () => void;
  review: { title: string; body: string }[];
  reviewTitle?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="pop grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5 border border-ink bg-card p-8 sm:p-10">
          <Label>Round complete</Label>
          <span className="text-[72px] leading-none font-medium tracking-[-0.045em] tabular-nums sm:text-[88px]">
            {pct}
            <span className="text-olive">%</span>
          </span>
          <span className="mt-1 text-[15px] text-graphite">{line}</span>
          <div className="my-4 h-px bg-rule" />
          {best && (
            <span className="flex items-center gap-2 text-[13px] font-medium">
              <Icon.check size={15} className="text-olive-ink" /> {best}
            </span>
          )}
          <p className="mt-2 font-serif text-[16px] leading-relaxed text-graphite">{note}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Btn variant="primary" size="lg" disabled={!onRetry} onClick={onRetry}>
            {retryLabel}
          </Btn>
          <Btn variant="strong" size="lg" onClick={onRestart}>
            Restart this round
          </Btn>
        </div>
        {extra}
      </div>
      {review.length > 0 && (
        <div className="flex flex-col gap-3">
          <Label>{reviewTitle}</Label>
          {review.map((r, i) => (
            <div key={i} className="flex flex-col gap-1.5 border border-rule border-l-[3px] border-l-olive bg-card px-4 py-3.5">
              <span className="text-[14px] leading-snug font-medium">{r.title}</span>
              <span className="font-serif text-[15px] leading-relaxed text-olive-ink">{r.body}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
