"use client";

import { bossQuiz, dailyChallenge, seedOf, type CQ } from "@/lib/challenge";
import { GRAMMAR_TOPICS, PUNCTUATION_TOPICS } from "@/lib/english-data";
import { level, tagLabel, weakSpots, weekKey, XP, xpThisWeek } from "@/lib/gamify";
import { dayKey } from "@/lib/utils";
import { useStore, type UI } from "../store";
import { Btn, Icon, Label, Progress, Source, Tag, setSessionValue, useSessionState } from "../ui";
import { Explanation, OptionButton, useChoiceKeys } from "../shared";

// Daily challenge, weekly boss, level and weak spots. Everything here is offline and
// built from hand-checked content (lib/challenge.ts).

type Run = { kind: "daily" | "boss"; key: string; qs: CQ[]; i: number; picked: number | null; score: number; missed: CQ[]; bonus: number | null };

export default function Challenges() {
  const [run, setRun] = useSessionState<Run | null>("challenge:run", null);
  return run ? <Runner run={run} setRun={setRun} /> : <Hub start={setRun} />;
}

// ================================================================== hub
function Hub({ start }: { start: (r: Run) => void }) {
  const { xp, perf, streak, challenges, ui, setUI } = useStore();
  const lv = level(xp.total);
  const today = dayKey();
  const week = weekKey();
  const daily = challenges.daily[today];
  const boss = challenges.boss[week];
  const weak = weakSpots(perf).slice(0, 5);
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7);

  const begin = (kind: "daily" | "boss") => {
    const key = kind === "daily" ? today : week;
    const qs = kind === "daily" ? dailyChallenge(perf, seedOf(today)) : bossQuiz(perf, seedOf(week) + Object.keys(perf).length);
    start({ kind, key, qs, i: 0, picked: null, score: 0, missed: [], bonus: null });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* level */}
      <div className="flex flex-col gap-4 border border-ink bg-card p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label>Your level</Label>
            <span className="text-[44px] leading-none font-medium tracking-[-0.035em]">Level {lv.n}</span>
          </div>
          <div className="grid grid-cols-3 gap-5 text-right">
            <Stat label="Today" value={`${xp.days[today] ?? 0} XP`} />
            <Stat label="This week" value={`${xpThisWeek(xp)} XP`} />
            <Stat label="Streak" value={streak.count ? `${streak.count}d` : "—"} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Progress value={lv.progress} />
          <span className="text-[11px] text-muted">{lv.into} / {lv.span} XP to level {lv.n + 1} · {xp.total} XP total</span>
        </div>
        <p className="text-[12px] text-muted">+{XP.correct} XP per correct answer, more for typed and recalled answers. Writing earns up to 20 per piece.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChallengeCard
          title="Daily challenge"
          meta="5 questions · about 2 minutes"
          blurb="One each from vocabulary, tenses, grammar, punctuation and slang — picked toward what you miss most."
          reward={`+${XP.dailyBonus} XP bonus`}
          done={daily ? `${daily.score}/${daily.total} today` : null}
          action={daily ? "Play again" : "Start today's challenge"}
          primary={!daily}
          onStart={() => begin("daily")}
        />
        <ChallengeCard
          title="Weekly boss"
          meta={`12 questions · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left this week`}
          blurb="A longer, harder mix that leans on your weak spots. Your best score this week counts."
          reward={`up to +${XP.bossMax} XP`}
          done={boss ? `Best ${boss.score}/${boss.total}` : null}
          action={boss ? "Try for a better score" : "Face the boss"}
          primary={!!daily && !boss}
          onStart={() => begin("boss")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <Label>Weak spots</Label>
          <span className="text-[11px] text-muted">from your answers across the app</span>
        </div>
        {weak.length ? (
          <div className="flex flex-col divide-y divide-rule border border-rule bg-card">
            {weak.map((w) => (
              <div key={w.tag} className="flex items-center gap-4 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[14px] font-medium">{tagLabel(w.tag)}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-[3px] w-24 bg-line"><div className="h-full bg-ink" style={{ width: `${Math.round(w.accuracy * 100)}%` }} /></div>
                    <span className="text-[11px] text-muted">{Math.round(w.accuracy * 100)}% · {w.attempts} tries</span>
                  </div>
                </div>
                <Btn variant="quiet" size="sm" onClick={() => practise(w.tag, ui, setUI)}>Practise</Btn>
              </div>
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-line px-4 py-5 text-[13px] text-muted">
            Answer a few questions anywhere in the app and the topics you find hardest will show up here, with a shortcut to practise them.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[16px] font-medium tabular-nums">{value}</span>
      <span className="text-[10px] tracking-[0.1em] text-muted uppercase">{label}</span>
    </div>
  );
}

function ChallengeCard(p: { title: string; meta: string; blurb: string; reward: string; done: string | null; action: string; primary: boolean; onStart: () => void }) {
  return (
    <div className="flex flex-col gap-3 border border-rule bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[18px] font-medium tracking-[-0.015em]">{p.title}</span>
          <span className="text-[11px] text-muted">{p.meta}</span>
        </div>
        {p.done ? <Tag tone="olive">✓ {p.done}</Tag> : <Tag>{p.reward}</Tag>}
      </div>
      <p className="flex-1 font-serif text-[14.5px] leading-relaxed text-graphite">{p.blurb}</p>
      <Btn variant={p.primary ? "primary" : "strong"} onClick={p.onStart}>{p.action}</Btn>
    </div>
  );
}

/** Jump from a weak tag straight to the screen that practises it. */
function practise(tag: string, ui: UI, setUI: (p: Partial<UI>) => void) {
  const [kind, ...rest] = tag.split(":");
  const name = rest.join(":");
  const modes = (m: Partial<UI["englishModes"]>) => ({ ...ui.englishModes, ...m });
  switch (kind) {
    case "tense":
      setSessionValue("tenses:focus", name);
      setSessionValue("tenses:opened", null);
      return setUI({ englishCat: "tenses", englishModes: modes({ tenses: "drill" }) });
    case "grammar":
      setSessionValue("grammar:cards:i", Math.max(0, (GRAMMAR_TOPICS as readonly string[]).indexOf(name)));
      setSessionValue("grammar:cards:seed", null);
      return setUI({ englishCat: "grammar", englishModes: modes({ grammar: "cards" }) });
    case "punct":
      setSessionValue("punctuation:cards:i", Math.max(0, (PUNCTUATION_TOPICS as readonly string[]).indexOf(name)));
      setSessionValue("punctuation:cards:seed", null);
      return setUI({ englishCat: "punct", englishModes: modes({ punct: "cards" }) });
    case "slang":
      return setUI({ englishCat: "slang", englishModes: modes({ slang: "quiz" }) });
    case "writing":
      return setUI({ englishCat: "writing" });
    case "design":
      return setUI({ subject: "design", designCat: name, designMode: "quiz" });
    default:
      return setUI({ englishCat: "vocab", englishModes: modes({ vocab: "quiz" }) });
  }
}

// ================================================================== runner
function Runner({ run, setRun }: { run: Run; setRun: (r: Run | null) => void }) {
  const { record, award, challenges, finishChallenge, ui, setUI } = useStore();
  const q = run.qs[run.i];
  const done = run.i >= run.qs.length;

  function answer(idx: number) {
    if (!q || run.picked != null || idx >= q.options.length) return;
    const right = idx === q.answer;
    record(q.tag, right);
    setRun({ ...run, picked: idx, score: run.score + (right ? 1 : 0), missed: right ? run.missed : [...run.missed, q] });
  }
  function next() {
    if (run.picked == null) return;
    const i = run.i + 1;
    if (i < run.qs.length) return setRun({ ...run, i, picked: null });
    // Finished: bonus only the first time today (daily) or this week (boss).
    const first = !challenges[run.kind][run.key];
    const pct = run.score / run.qs.length;
    const bonus = first ? (run.kind === "daily" ? XP.dailyBonus : Math.round(XP.bossMax * pct)) : 0;
    if (bonus) award(bonus);
    finishChallenge(run.kind, run.key, run.score, run.qs.length);
    setRun({ ...run, i, picked: null, bonus });
  }
  useChoiceKeys((k) => ("pick" in k ? answer(k.pick) : next()));

  if (done) {
    const pct = Math.round((run.score / run.qs.length) * 100);
    return (
      <div className="pop flex flex-col gap-5">
        <div className="flex flex-col items-start gap-3 border border-ink bg-card p-7">
          <Label>{run.kind === "daily" ? "Daily challenge" : "Weekly boss"} complete</Label>
          <span className="text-[56px] leading-none font-medium tracking-[-0.04em]">{run.score}<span className="text-muted">/{run.qs.length}</span></span>
          <p className="font-serif text-[16px] text-graphite">
            {pct === 100 ? "Flawless." : pct >= 70 ? "Strong work — the misses below are worth a quick look." : "The misses below are now weighted into your next challenges."}
          </p>
          {run.bonus ? <Tag tone="olive">+{run.bonus} XP bonus</Tag> : <span className="text-[12px] text-muted">Bonus already collected — answers still earn XP.</span>}
        </div>
        {run.missed.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>To review</Label>
            {run.missed.map((m) => (
              <div key={m.tag + m.prompt} className="flex items-center gap-3 border border-rule bg-card px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[11px] text-muted">{m.kind}</span>
                  <span className="truncate text-[14px]">{tagLabel(m.tag)}</span>
                </div>
                <Btn variant="quiet" size="sm" onClick={() => { setRun(null); practise(m.tag, ui, setUI); }}>Practise</Btn>
              </div>
            ))}
          </div>
        )}
        <Btn variant="ink" size="lg" onClick={() => setRun(null)}>Back to challenges</Btn>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setRun(null)} className="tap flex h-9 items-center gap-1.5 text-[13px] font-medium text-olive-ink"><Icon.left size={14} /> Challenges</button>
        <Tag tone="olive">{run.kind === "daily" ? "Daily challenge" : "Weekly boss"}</Tag>
      </div>
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between"><span className="text-[12px] font-medium">Question {run.i + 1} of {run.qs.length}</span><span className="text-[11px] text-muted">Score {run.score}</span></div>
        <Progress value={run.i / run.qs.length} />
      </div>
      <div className="flex flex-col gap-4 border border-ink bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <Label>{q.kind}</Label>
          {q.detail && q.kind !== "Vocabulary" && <span className="text-[11px] text-muted">{q.detail}</span>}
        </div>
        <p className="font-serif text-[19px] leading-snug">{q.prompt}</p>
        {q.kind === "Vocabulary" && q.detail && <p className="font-serif text-[17px] leading-snug text-graphite">“{q.detail}”</p>}
        <div className="flex flex-col gap-2">
          {q.options.map((o, idx) => <OptionButton key={o} index={idx} text={o} picked={run.picked} answer={q.answer} onPick={() => answer(idx)} />)}
        </div>
        {run.picked != null && <Explanation right={run.picked === q.answer} text={q.why} />}
      </div>
      <Btn variant="ink" size="lg" disabled={run.picked == null} onClick={next}>{run.i + 1 === run.qs.length ? "Finish" : "Next question"}</Btn>
      <Source>Hand-checked questions · works offline</Source>
    </div>
  );
}
