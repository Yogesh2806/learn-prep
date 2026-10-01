"use client";

import { useEffect, useState } from "react";
import { ai } from "@/lib/ai";
import { lookup } from "@/lib/dictionary";
import { stats } from "@/lib/fsrs";
import { dayKey } from "@/lib/utils";
import { wordOfTheDay } from "@/lib/words";
import { useStore } from "../store";
import { Btn, ErrorPanel, Label, Skeleton, Source, SpeakBtn, StaleNote, Tag, useAsync } from "../ui";
import { Explanation, OptionButton } from "../shared";

export default function WordOfDay() {
  const { deck, streak, record, setUI } = useStore();
  const word = wordOfTheDay();
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long" });

  const dict = useAsync(`wotd-dict:${word}`, () => lookup(word));
  // A curated entry already leads with the everyday sense, so the AI only teaches that one.
  const teachSenses = dict.data ? (dict.data.curated ? dict.data.senses.slice(0, 1) : dict.data.senses) : [];
  const teach = useAsync(dict.data ? `wotd-teach:${word}:${dayKey()}` : null, () =>
    ai("word-teach", { word, senses: teachSenses }, { cacheKey: `${word}:${teachSenses.length}:${teachSenses[0].definition.length}` }),
  );
  const [picked, setPicked] = useState<number | null>(null);
  // The AI picks the everyday sense; hold the definition briefly so it doesn't swap under
  // the reader, but never make a dictionary fact wait on a slow model.
  const [waitedForSense, setWaitedForSense] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setWaitedForSense(true), 2500);
    return () => clearTimeout(id);
  }, []);

  const entry = dict.data;
  const t = teach.data;
  const sense = entry ? teachSenses[t?.sense ?? 0] ?? entry.senses[0] : null;
  const due = stats(deck).dueToday;
  const doneToday = streak.last === dayKey();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <Label>Word of the Day · {today}</Label>
          <span className="text-[11px] font-medium text-olive-ink">{streak.count ? `Day ${streak.count} streak` : "Start a streak today"}</span>
        </div>

        <article className="flex flex-col gap-5 border border-ink bg-card p-6 sm:p-9">
          {dict.status === "error" ? (
            <ErrorPanel error={dict.error} onRetry={dict.retry} />
          ) : !entry ? (
            <Skeleton lines={4} />
          ) : (
            <>
              <div className="flex items-start justify-between gap-5">
                <div className="flex min-w-0 flex-col gap-2">
                  <h1 className="text-[38px] leading-none font-medium tracking-[-0.035em] capitalize sm:text-[46px]">{word}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    {entry.ipa && <span className="font-serif text-[16px] text-graphite">{entry.ipa}</span>}
                    {sense && <Tag tone="olive">{sense.pos}</Tag>}
                  </div>
                </div>
                <SpeakBtn text={word} audio={entry.audio} variant="olive" size={48} label={`Hear ${word}`} />
              </div>
              <div className="h-px bg-rule" />
              {teach.status === "loading" && !t && !entry.curated && !waitedForSense ? (
                <div className="flex flex-col gap-2.5"><div className="skeleton h-5 w-full" /><div className="skeleton h-5 w-3/4" /></div>
              ) : (
                <p className="font-serif text-[20px] leading-normal sm:text-[22px]">{sense?.definition}</p>
              )}

              {t && (
                <>
                  <div className="flex flex-col gap-2.5">
                    <Label>Where to use it</Label>
                    <div className="flex flex-col gap-2.5 border-l-2 border-olive-line pl-3.5">
                      {t.examples.map((ex) => (
                        <div key={ex} className="flex items-start gap-1.5">
                          <p className="flex-1 font-serif text-[16px] leading-relaxed text-graphite">{ex}</p>
                          <SpeakBtn variant="inline" text={ex} label="Hear this example" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-10 gap-y-4">
                    <div className="flex flex-col gap-2">
                      <Label>Where you&apos;ve heard it</Label>
                      <div className="flex flex-wrap gap-1.5">{t.heardIn.map((h) => <Tag key={h}>{h}</Tag>)}</div>
                    </div>
                    {entry.synonyms.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <Label>Close in meaning</Label>
                        <div className="flex flex-wrap gap-1.5">{entry.synonyms.slice(0, 4).map((s) => <Tag key={s}>{s}</Tag>)}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Origin</Label>
                    <p className="text-[13px] leading-relaxed text-graphite">{t.origin}</p>
                  </div>
                </>
              )}
              {teach.status === "error" && <ErrorPanel compact error={teach.error} onRetry={teach.retry} />}
              <StaleNote show={!!dict.stale} />
            </>
          )}
        </article>

        {entry && (
          <Source>
            Definition{entry.ipa ? ", IPA" : ""}{entry.audio ? " & audio" : ""} · {entry.sources.join(" + ")} · Examples, origin &amp; check written by AI
          </Source>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 border-t border-ink pt-3">
          <Label>Why this word</Label>
          <p className="font-serif text-[15px] leading-relaxed">You&apos;ve heard it this month. Most people couldn&apos;t define it. Every word here is picked for that gap — familiar sound, fuzzy meaning — never for rarity.</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Label>10-second check</Label>
          <div className="flex flex-col gap-3 border border-rule bg-card p-4">
            {!t ? (
              teach.status === "error" ? <p className="text-[13px] text-muted">The check needs the teaching layer — try again above.</p> : <Skeleton title={false} lines={3} />
            ) : (
              <>
                <p className="font-serif text-[16px] leading-snug">{t.check.question}</p>
                <div className="flex flex-col gap-2">
                  {t.check.options.map((o, i) => (
                    <OptionButton
                      key={o}
                      index={i}
                      text={o}
                      picked={picked}
                      answer={t.check.answer}
                      onPick={() => {
                        if (picked != null) return;
                        setPicked(i);
                        record("vocab", i === t.check.answer); // a real answer — not just opening the page — keeps the streak
                      }}
                    />
                  ))}
                </div>
                {picked != null && <Explanation right={picked === t.check.answer} text={t.check.why} />}
                {picked == null && doneToday && <p className="text-[11px] text-muted">Today already counts toward your streak.</p>}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border border-rule bg-card p-4">
          <Label>Up next</Label>
          <div className="flex items-center justify-between text-[13px]">
            <span>Vocabulary review</span>
            <span className="font-medium text-olive-ink">{due ? `${due} due` : "new words ready"}</span>
          </div>
          <Btn variant="ink" onClick={() => setUI({ englishCat: "vocab" })}>
            Start review
          </Btn>
        </div>
      </aside>
    </div>
  );
}
