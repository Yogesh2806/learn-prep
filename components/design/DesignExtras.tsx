"use client";

import { useEffect, useState } from "react";
import { ai } from "@/lib/ai";
import type { DesignCard } from "@/lib/design-data";
import { ErrorPanel, Icon, Label, Source, useAsync } from "../ui";

// The dynamic layer on a fixed Design definition: examples and an interview line are
// generated (and labelled); the definition above them never is.

export default function DesignExtras({ card }: { card: DesignCard }) {
  // Wait a beat after the flip so flicking through cards doesn't fire a request per card.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 450);
    return () => clearTimeout(t);
  }, []);

  const input = { term: card.term, definition: card.def };
  const extras = useAsync(armed ? `extras:${card.id}` : null, () => ai("design-extras", input));
  const [more, setMore] = useState<null | "explain" | "hook">(null);
  const moreRes = useAsync(more ? `${more}:${card.id}` : null, async () => {
    if (more === "explain") {
      const r = await ai("explain-differently", input);
      return { value: r.value.explanation, stale: r.stale };
    }
    const r = await ai("mnemonic", input);
    return { value: r.value.hook, stale: r.stale };
  });

  return (
    <section className="pop flex flex-col gap-4 border border-rule bg-card p-5 sm:p-6" aria-label="Written for you">
      <div className="flex items-center gap-2.5">
        <span className="label-caps flex items-center gap-1.5 !text-olive-ink">
          <Icon.spark size={12} /> Written for you
        </span>
        <div className="h-px flex-1 bg-rule" />
      </div>

      {extras.status === "error" ? (
        <ErrorPanel compact error={extras.error} onRetry={extras.retry} />
      ) : extras.status !== "ready" ? (
        <div className="grid gap-5 sm:grid-cols-2" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton h-3 w-28" />
              <div className="skeleton h-3.5 w-full" />
              <div className="skeleton h-3.5 w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium">Spot it in the wild</span>
            <p className="font-serif text-[15px] leading-relaxed text-graphite">{extras.data!.wild}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium">Say it in an interview</span>
            <p className="font-serif text-[15px] leading-relaxed text-graphite">“{extras.data!.interview}”</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setMore("explain")} aria-pressed={more === "explain"} className="tap press h-9 rounded-[4px] border border-line bg-card px-3 text-[12px] font-medium text-graphite hover:border-muted hover:text-ink aria-pressed:border-ink aria-pressed:text-ink">
          Explain it differently
        </button>
        <button type="button" onClick={() => setMore("hook")} aria-pressed={more === "hook"} className="tap press flex h-9 items-center gap-1.5 rounded-[4px] border border-line bg-card px-3 text-[12px] font-medium text-graphite hover:border-muted hover:text-ink aria-pressed:border-ink aria-pressed:text-ink">
          <Icon.bulb size={13} /> Memory hook
        </button>
      </div>

      {more && (
        <div className="pop border-l-[3px] border-olive bg-olive-tint px-4 py-3">
          <Label className="!text-olive-ink">{more === "explain" ? "Another way to see it" : "Memory hook"}</Label>
          {moreRes.status === "error" ? (
            <div className="mt-2"><ErrorPanel compact error={moreRes.error} onRetry={moreRes.retry} /></div>
          ) : moreRes.status !== "ready" ? (
            <div className="mt-2 flex flex-col gap-2"><div className="skeleton h-3.5 w-full" /><div className="skeleton h-3.5 w-2/3" /></div>
          ) : (
            <p className="mt-1 font-serif text-[15px] leading-relaxed">{moreRes.data}</p>
          )}
        </div>
      )}

      <Source>Definition · curated deck, never generated · Everything under “Written for you” · AI, saved on this device</Source>
    </section>
  );
}
