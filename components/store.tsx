"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadDeck, saveDeck, type Deck } from "@/lib/fsrs";
import { loadDesign, loadStreak, markStudied, resetAll, saveDesign, type DesignProgress, type Streak } from "@/lib/progress";
import { addResult, addXp, loadChallenges, loadPerf, loadXp, saveChallenge, XP, type Challenges, type Perf, type XpState } from "@/lib/gamify";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";

export type Subject = "design" | "english";
/** Settings → "What to study": hide the subject you don't need. */
export type Sections = Subject | "both";
export type EnglishCat = "challenge" | "word" | "vocab" | "tenses" | "grammar" | "punct" | "writing" | "slang" | "doubt";
export type UI = {
  subject: Subject;
  sections?: Sections;
  designCat: string; // "All" or a DesignCategory
  designMode: "flashcards" | "quiz" | "recall";
  englishCat: EnglishCat;
  englishModes: Partial<Record<EnglishCat, string>>;
};

const DEFAULT_UI: UI = { subject: "design", sections: "both", designCat: "All", designMode: "flashcards", englishCat: "word", englishModes: {} };

type Store = {
  ui: UI;
  setUI: (patch: Partial<UI>) => void;
  design: DesignProgress;
  setDesign: (fn: (p: DesignProgress) => DesignProgress) => void;
  deck: Deck;
  setDeck: (fn: (d: Deck) => Deck) => void;
  streak: Streak;
  studied: () => void;
  xp: XpState;
  perf: Perf;
  challenges: Challenges;
  /** One answered question: counts toward the streak, XP (if right) and the tag's accuracy. */
  record: (tag: string | null, correct: boolean, xp?: number) => void;
  /** XP not tied to one question (a review, a writing score, a challenge bonus). */
  award: (xp: number) => void;
  finishChallenge: (kind: "daily" | "boss", key: string, score: number, total: number) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

/** Everything persistent lives here. Rendered only after mount, so reads are safe. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [ui, setUIState] = useState<UI>(() => ({ ...DEFAULT_UI, ...readJSON<Partial<UI>>(KEYS.ui, {}) }));
  const [design, setDesignState] = useState<DesignProgress>(loadDesign);
  const [deck, setDeckState] = useState<Deck>(loadDeck);
  const [streak, setStreak] = useState<Streak>(loadStreak);
  const [xp, setXp] = useState<XpState>(loadXp);
  const [perf, setPerf] = useState<Perf>(loadPerf);
  const [challenges, setChallenges] = useState<Challenges>(loadChallenges);

  useEffect(() => void writeJSON(KEYS.ui, ui), [ui]);

  const setUI = useCallback((patch: Partial<UI>) => setUIState((u) => ({ ...u, ...patch })), []);
  const setDesign = useCallback((fn: (p: DesignProgress) => DesignProgress) => {
    setDesignState((p) => {
      const next = fn(p);
      saveDesign(next);
      return next;
    });
  }, []);
  const setDeck = useCallback((fn: (d: Deck) => Deck) => {
    setDeckState((d) => {
      const next = fn(d);
      saveDeck(next);
      return next;
    });
  }, []);
  const studied = useCallback(() => setStreak(markStudied()), []);
  const award = useCallback((n: number) => setXp((s) => addXp(s, Math.round(n))), []);
  const record = useCallback(
    (tag: string | null, correct: boolean, n: number = XP.correct) => {
      setStreak(markStudied());
      if (correct) setXp((s) => addXp(s, n));
      if (tag) setPerf((p) => addResult(p, tag, correct));
    },
    [],
  );
  const finishChallenge = useCallback(
    (kind: "daily" | "boss", key: string, score: number, total: number) => setChallenges((c) => saveChallenge(c, kind, key, score, total)),
    [],
  );
  const reset = useCallback(() => {
    resetAll();
    setUIState(DEFAULT_UI);
    setDesignState(loadDesign());
    setDeckState(loadDeck());
    setStreak(loadStreak());
    setXp(loadXp());
    setPerf(loadPerf());
    setChallenges(loadChallenges());
  }, []);

  const value = useMemo(
    () => ({ ui, setUI, design, setDesign, deck, setDeck, streak, studied, xp, perf, challenges, record, award, finishChallenge, reset }),
    [ui, setUI, design, setDesign, deck, setDeck, streak, studied, xp, perf, challenges, record, award, finishChallenge, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
