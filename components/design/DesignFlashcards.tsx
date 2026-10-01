"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { DECK, type DesignCard } from "@/lib/design-data";
import { cx, isTypingTarget, shuffle } from "@/lib/utils";
import { useStore } from "../store";
import { Btn, Empty, Icon, Label, Progress, useSessionState, useToast } from "../ui";
import DesignExtras from "./DesignExtras";

const BY_ID = Object.fromEntries(DECK.map((c) => [c.id, c])) as Record<string, DesignCard>;

export default function DesignFlashcards({ category }: { category: string }) {
  const { design, setDesign } = useStore();
  const toast = useToast();
  const pool = useMemo(() => (category === "All" ? DECK : DECK.filter((c) => c.cat === category)), [category]);

  const [missedOnly, setMissedOnly] = useSessionState(`dcards:${category}:missed`, false);
  const [order, setOrder] = useSessionState<string[]>(`dcards:${category}:order`, () => pool.map((c) => c.id));
  const [pos, setPos] = useSessionState(`dcards:${category}:pos`, 0);
  const [flipped, setFlipped] = useState(false);
  // The face content lags the index briefly so the swap hides behind the flip-back.
  const [shownId, setShownId] = useState<string | null>(order[pos] ?? null);
  const swapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const current = order[pos] ?? null;
  const card = shownId ? BY_ID[shownId] : null;

  function show(nextOrder: string[], nextPos: number) {
    const wasFlipped = flipped;
    setOrder(nextOrder);
    setPos(nextPos);
    setFlipped(false);
    clearTimeout(swapTimer.current);
    const id = nextOrder[nextPos] ?? null;
    if (wasFlipped && id && !matchMedia("(prefers-reduced-motion: reduce)").matches) swapTimer.current = setTimeout(() => setShownId(id), 260);
    else setShownId(id);
  }
  useEffect(() => () => clearTimeout(swapTimer.current), []);

  const go = (delta: number) => order.length > 1 && show(order, (pos + delta + order.length) % order.length);

  function toggleMissed() {
    const next = !missedOnly;
    setMissedOnly(next);
    const ids = pool.filter((c) => !next || design.marks[c.id] === "review").map((c) => c.id);
    show(ids, 0);
  }

  function mark(val: "known" | "review") {
    if (!current) return;
    setDesign((p) => ({ ...p, marks: { ...p.marks, [current]: val } }));
    if (missedOnly && val === "known") {
      const rest = order.filter((id) => id !== current);
      toast(rest.length ? "Cleared from the review pile" : "Review pile empty — nice work");
      show(rest, pos >= rest.length ? 0 : pos);
      return;
    }
    toast(val === "known" ? "Marked as known" : "Added to review pile");
    if (order.length > 1) go(1);
    else setFlipped(false);
  }

  const counts = useMemo(() => {
    let known = 0, review = 0;
    for (const c of pool) {
      if (design.marks[c.id] === "known") known++;
      else if (design.marks[c.id] === "review") review++;
    }
    return { known, review };
  }, [pool, design.marks]);

  // Keyboard: space/enter flip, arrows move, 1 got it, 2 review.
  // useEffectEvent: always sees the latest state, without re-subscribing the listener.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const onButton = (e.target as HTMLElement)?.tagName === "BUTTON";
    if ((e.key === " " || e.key === "Enter") && !onButton) {
      e.preventDefault();
      if (current) setFlipped((f) => !f);
    } else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "1") mark("known");
    else if (e.key === "2") mark("review");
  });
  useEffect(() => {
    const on = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const total = order.length;
  const status = current ? design.marks[current] : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-medium tabular-nums">{total ? `Card ${pos + 1} of ${total}` : "No cards"}</span>
          <span className="text-[11px] text-muted">
            {counts.known} known · {counts.review} review
          </span>
        </div>
        <Progress value={total ? (pos + 1) / total : 0} />
      </div>

      {!card || !total ? (
        <Empty
          title={missedOnly ? "No missed cards — nice work." : "Nothing here yet."}
          body={missedOnly ? "Cards you mark “Review again” land here so you can drill just those." : "This category has no cards."}
          action={missedOnly ? <Btn variant="ink" onClick={toggleMissed}>Show all cards</Btn> : undefined}
        />
      ) : (
        <>
          <div
            className="flip tap h-[clamp(320px,50vh,440px)] cursor-pointer select-none"
            data-flipped={flipped}
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            aria-label={flipped ? `Definition of ${card.term}. Activate to show the term.` : `${card.term}. Activate to reveal the definition.`}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                setFlipped((f) => !f);
              }
            }}
          >
            <div className="flip-inner">
              <div className="face border border-rule bg-card p-7 sm:p-9">
                <div className="flex items-start justify-between gap-3">
                  <Label>{card.cat}</Label>
                  {status && <span className={cx("label-caps", status === "known" ? "!text-olive-ink" : "!text-ink")}>{status}</span>}
                </div>
                <div className="flex flex-1 items-center py-4">
                  <h2 className="text-[30px] leading-[1.08] font-medium tracking-[-0.03em] sm:text-[36px]">{card.term}</h2>
                </div>
                <p className="text-center text-[11px] tracking-[0.1em] text-muted uppercase">Tap to reveal</p>
              </div>
              <div className="face face-back border border-ink bg-card p-7 sm:p-9">
                <div className="flex flex-col gap-1">
                  <Label>{card.cat}</Label>
                  <span className="text-[19px] font-medium tracking-[-0.02em]">{card.term}</span>
                </div>
                <div className="my-4 h-px bg-rule" />
                <div className="flex flex-1 items-center">
                  <p className="font-serif text-[20px] leading-normal sm:text-[23px]">{card.def}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Btn variant="primary" size="lg" onClick={(e) => { e.stopPropagation(); mark("known"); }}>Got it</Btn>
                  <Btn variant="strong" size="lg" onClick={(e) => { e.stopPropagation(); mark("review"); }}>Review again</Btn>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Btn variant="quiet" size="lg" className="w-[52px] !px-0" aria-label="Previous card" disabled={total < 2} onClick={() => go(-1)}>
              <Icon.left />
            </Btn>
            <Btn variant={flipped ? "strong" : "ink"} size="lg" className="flex-1" onClick={() => setFlipped((f) => !f)}>
              {flipped ? "Show term" : "Flip card"}
            </Btn>
            <Btn variant="quiet" size="lg" className="w-[52px] !px-0" aria-label="Next card" disabled={total < 2} onClick={() => go(1)}>
              <Icon.right />
            </Btn>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Btn variant="quiet" disabled={total < 2} onClick={() => { show(shuffle(order), 0); toast("Shuffled"); }}>
          <Icon.shuffle size={15} /> Shuffle
        </Btn>
        <Btn variant="quiet" aria-pressed={missedOnly} onClick={toggleMissed} className={cx(missedOnly && "!border-olive !text-olive-ink")}>
          <span className={cx("relative inline-flex h-4 w-7 items-center rounded-full transition-colors", missedOnly ? "bg-olive" : "bg-line")}>
            <span className={cx("ml-0.5 h-3 w-3 rounded-full bg-card shadow transition-transform", missedOnly && "translate-x-3")} />
          </span>
          Missed only
        </Btn>
      </div>

      {card && flipped && <DesignExtras key={card.id} card={card} />}

      <p className="hidden text-center text-[11px] text-muted sm:block">Space flips · ← → navigate · 1 got it · 2 review</p>
    </div>
  );
}
