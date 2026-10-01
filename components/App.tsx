"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { DECK, DESIGN_CATEGORIES } from "@/lib/design-data";
import { stats as deckStats } from "@/lib/fsrs";
import { level, XP } from "@/lib/gamify";
import { KEYS, writeJSON } from "@/lib/storage";
import { cx, dayKey } from "@/lib/utils";
import { StoreProvider, useStore, type EnglishCat, type UI } from "./store";
import { Chip, Icon, IconBtn, Label, Segmented, ToastProvider } from "./ui";
import DesignView from "./design/DesignView";
import EnglishView from "./english/EnglishView";

// ------------------------------------------------------------------ navigation model
const DESIGN_MODES = [
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Quiz" },
  { id: "recall", label: "Recall" },
] as const;

export const ENGLISH_CATS: { id: EnglishCat; label: string; modes?: { id: string; label: string }[] }[] = [
  { id: "word", label: "Word of the Day" },
  { id: "challenge", label: "Challenges" },
  { id: "vocab", label: "Vocabulary", modes: [...DESIGN_MODES] },
  { id: "tenses", label: "Tenses", modes: [{ id: "trainer", label: "Trainer" }, { id: "map", label: "All 12" }, { id: "drill", label: "Drill" }] },
  { id: "grammar", label: "Grammar Rules", modes: [{ id: "cards", label: "Cards" }, { id: "practice", label: "Practice" }] },
  { id: "punct", label: "Punctuation", modes: [{ id: "cards", label: "Cards" }, { id: "fix", label: "Fix it" }] },
  { id: "writing", label: "Writing Arena", modes: [{ id: "challenge", label: "Rewrite" }, { id: "free", label: "Free write" }] },
  { id: "slang", label: "Gen Z Slang", modes: [{ id: "cards", label: "Today's cards" }, { id: "quiz", label: "Quiz" }] },
  { id: "doubt", label: "Doubt Solver" },
];

export function englishMode(ui: UI, cat: EnglishCat) {
  const def = ENGLISH_CATS.find((c) => c.id === cat)!;
  const m = ui.englishModes[cat];
  return def.modes?.some((x) => x.id === m) ? m! : def.modes?.[0].id ?? "";
}

// ------------------------------------------------------------------ mount gate
const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export default function App() {
  const mounted = useMounted();
  useServiceWorker();
  if (!mounted) return <ShellSkeleton />;
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}

function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
}

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

// ------------------------------------------------------------------ theme
function useTheme() {
  const dark = useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    try {
      localStorage.setItem(KEYS.theme, next);
    } catch {
      /* ignore */
    }
  };
  // Follow the system until the learner chooses.
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(KEYS.theme);
      } catch {
        /* ignore */
      }
      if (stored) return;
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return { dark, toggle };
}

// ------------------------------------------------------------------ shell
function Shell() {
  const { ui, setUI } = useStore();
  const online = useOnline();
  const theme = useTheme();
  const isDesign = ui.subject === "design";
  const engCat = ENGLISH_CATS.find((c) => c.id === ui.englishCat)!;

  const modes = isDesign ? DESIGN_MODES : engCat.modes;
  const mode = isDesign ? ui.designMode : englishMode(ui, ui.englishCat);
  const setMode = (m: string) =>
    isDesign ? setUI({ designMode: m as UI["designMode"] }) : setUI({ englishModes: { ...ui.englishModes, [ui.englishCat]: m } });

  const categories = isDesign
    ? ["All", ...DESIGN_CATEGORIES].map((c) => ({ id: c, label: c }))
    : ENGLISH_CATS.map((c) => ({ id: c.id, label: c.label }));
  const activeCat = isDesign ? ui.designCat : ui.englishCat;
  const setCat = (id: string) => (isDesign ? setUI({ designCat: id }) : setUI({ englishCat: id as EnglishCat }));

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1320px] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* ---------------- desktop rail ---------------- */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-[22px] overflow-y-auto border-r border-rule px-6 py-8 lg:flex">
        <Wordmark />
        <div className="flex flex-col gap-2.5">
          <Label>Subject</Label>
          <Segmented label="Subject" tone="ink" size="sm" value={ui.subject} onChange={(s) => setUI({ subject: s })} options={[{ id: "design", label: "Design" }, { id: "english", label: "English" }]} />
        </div>
        {modes && (
          <div className="flex flex-col gap-2.5">
            <Label>Mode</Label>
            <div className="flex flex-col gap-0.5">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  aria-pressed={mode === m.id}
                  className={cx("tap press h-11 rounded-[4px] px-3.5 text-left text-sm", mode === m.id ? "bg-olive font-medium text-on-olive" : "text-graphite hover:bg-soft hover:text-ink")}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          <Label>Category</Label>
          <nav className="flex flex-col gap-px" aria-label="Categories">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                aria-current={activeCat === c.id ? "page" : undefined}
                className={cx(
                  "tap flex h-[38px] items-center justify-between border-l-2 px-3.5 text-left text-[13px] transition-colors",
                  activeCat === c.id ? "border-ink font-medium text-ink" : "border-transparent text-graphite hover:text-ink",
                )}
              >
                <span>{c.label}</span>
                <CategoryCount subject={ui.subject} id={c.id} />
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1" />
        <Stats />
        <div className="flex items-center gap-2">
          <IconBtn label={theme.dark ? "Switch to light mode" : "Switch to dark mode"} onClick={theme.toggle}>
            {theme.dark ? <Icon.moon size={17} /> : <Icon.sun size={17} />}
          </IconBtn>
          <ResetButton />
        </div>
      </aside>

      {/* ---------------- content column ---------------- */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-rule bg-paper/90 px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-2.5">
            <Wordmark small />
            <div className="flex items-center overflow-hidden rounded-full border border-line" role="tablist" aria-label="Subject">
              {(["design", "english"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={ui.subject === s}
                  onClick={() => setUI({ subject: s })}
                  className={cx("tap h-[34px] px-[13px] text-[12px] capitalize", ui.subject === s ? "bg-ink font-medium text-on-ink" : "bg-card text-graphite")}
                >
                  {s}
                </button>
              ))}
            </div>
            <IconBtn label={theme.dark ? "Switch to light mode" : "Switch to dark mode"} onClick={theme.toggle}>
              {theme.dark ? <Icon.moon size={17} /> : <Icon.sun size={17} />}
            </IconBtn>
          </div>
          <div className="no-bar -mx-5 flex gap-[7px] overflow-x-auto px-5" role="tablist" aria-label="Categories">
            {categories.map((c) => (
              <Chip key={c.id} active={activeCat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </header>

        {!online && (
          <div className="flex items-center gap-2 border-b border-rule bg-soft px-5 py-2 text-[12px] text-graphite lg:px-12">
            <Icon.offline size={14} />
            Offline — everything you&apos;ve already opened still works. New words and AI feedback return when you reconnect.
          </div>
        )}

        <main className="flex w-full max-w-[920px] flex-1 flex-col gap-4 px-5 py-5 lg:px-12 lg:py-8">
          {modes && (
            <div className="lg:hidden">
              <Segmented label="Mode" size="sm" value={mode} onChange={setMode} options={modes} />
            </div>
          )}
          {isDesign ? <DesignView /> : <EnglishView />}
        </main>

        <footer className="border-t border-rule px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] lg:hidden">
          <Stats />
          <div className="mt-3 flex justify-center">
            <ResetButton />
          </div>
        </footer>
      </div>
    </div>
  );
}

function Wordmark({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cx("bg-olive", small ? "h-4 w-4" : "h-[18px] w-[18px]")} aria-hidden />
      <span className={cx("font-bold tracking-[-0.02em]", small ? "text-base" : "text-[17px]")}>Learn Prep</span>
    </div>
  );
}

function CategoryCount({ subject, id }: { subject: string; id: string }) {
  const { deck, challenges } = useStore();
  if (subject === "design") {
    const n = id === "All" ? DECK.length : DECK.filter((c) => c.cat === id).length;
    return <span className="text-[11px] text-muted">{n}</span>;
  }
  if (id === "challenge" && !challenges.daily[dayKey()]) return <span className="text-[11px] font-medium text-olive-ink">+{XP.dailyBonus}</span>;
  if (id === "vocab") {
    const due = deckStats(deck).dueToday;
    return due ? <span className="text-[11px] font-medium text-olive-ink">{due} due</span> : null;
  }
  return null;
}

function Stats() {
  const { ui, design, deck, streak, xp } = useStore();
  let items: [string, string | number][];
  if (ui.subject === "design") {
    const pool = ui.designCat === "All" ? DECK : DECK.filter((c) => c.cat === ui.designCat);
    const known = pool.filter((c) => design.marks[c.id] === "known").length;
    const bq = design.bestQuiz[ui.designCat];
    const br = design.bestRecall[ui.designCat];
    items = [
      ["Known", `${known}/${pool.length}`],
      ["Best quiz", bq != null ? `${bq}%` : "—"],
      ["Best recall", br != null ? `${br}%` : "—"],
    ];
  } else {
    const s = deckStats(deck);
    items = [
      ["Streak", streak.count ? `${streak.count} day${streak.count === 1 ? "" : "s"}` : "—"],
      ["Level", `${level(xp.total).n} · ${xp.total} XP`],
      ["Due today", s.dueToday],
    ];
  }
  return (
    <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-col lg:gap-2 lg:border-t lg:border-rule lg:pt-4">
      {items.map(([k, v]) => (
        <div key={k} className="flex flex-col items-center gap-0.5 bg-card px-2 py-3 lg:flex-row lg:justify-between lg:bg-transparent lg:p-0">
          <span className="order-2 text-[10px] font-medium uppercase tracking-[0.1em] text-muted lg:order-1 lg:text-[12px] lg:normal-case lg:tracking-normal">{k}</span>
          <span className="order-1 text-lg font-medium tabular-nums lg:order-2 lg:text-[12px]">{v}</span>
        </div>
      ))}
    </div>
  );
}

function ResetButton() {
  const { reset } = useStore();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm("Reset all progress?\n\nThis clears Design marks and best scores, your English review schedule and your streak. Saved words and AI answers stay cached. It can't be undone.")) {
          reset();
          writeJSON(KEYS.ui, null);
        }
      }}
      className="tap rounded px-2 py-2 text-[12px] text-muted hover:text-ink"
    >
      Reset progress
    </button>
  );
}

function ShellSkeleton(): ReactNode {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1320px] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]" aria-busy="true">
      <aside className="hidden border-r border-rule px-6 py-8 lg:block">
        <Wordmark />
      </aside>
      <div className="px-5 py-5 lg:px-12 lg:py-8">
        <div className="lg:hidden">
          <Wordmark small />
        </div>
        <div className="mt-6 max-w-[640px] border border-rule bg-card p-6">
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton mt-5 h-3.5 w-full" />
          <div className="skeleton mt-3 h-3.5 w-3/4" />
        </div>
      </div>
    </div>
  );
}
