import { DECK } from "./design-data";
import { KEYS, readJSON, removeKey, writeJSON } from "./storage";
import { dayKey, daysBetween } from "./utils";

// Design keeps the binary Got it / Review again model — a finite deck revised before an
// interview. English uses FSRS (lib/fsrs.ts).

export type Mark = "known" | "review";
export type DesignProgress = {
  marks: Record<string, Mark>;
  bestQuiz: Record<string, number>;
  bestRecall: Record<string, number>;
  migratedFrom?: string;
};

const EMPTY: DesignProgress = { marks: {}, bestQuiz: {}, bestRecall: {} };
const VALID_IDS = new Set(DECK.map((c) => c.id));

/**
 * One-time import from the single-file app ("designprep.v1"). It only finds data when the
 * new app is served from the same origin the old file was, e.g. the same Netlify site.
 * Card ids are unchanged (c0…c84), so marks carry over one-to-one.
 */
function migrateLegacy(): DesignProgress | null {
  const old = readJSON<{ progress?: Record<string, string>; best?: Record<string, number>; bestRecall?: Record<string, number> } | null>(KEYS.legacy, null);
  if (!old) return null;
  const marks: Record<string, Mark> = {};
  for (const [id, v] of Object.entries(old.progress ?? {})) if (VALID_IDS.has(id) && (v === "known" || v === "review")) marks[id] = v;
  return { marks, bestQuiz: old.best ?? {}, bestRecall: old.bestRecall ?? {}, migratedFrom: KEYS.legacy };
}

export function loadDesign(): DesignProgress {
  const current = readJSON<DesignProgress | null>(KEYS.design, null);
  if (current) return { ...EMPTY, ...current };
  const migrated = migrateLegacy();
  if (migrated) {
    writeJSON(KEYS.design, migrated);
    return migrated;
  }
  return { ...EMPTY };
}

export const saveDesign = (p: DesignProgress) => writeJSON(KEYS.design, p);

// ---------------------------------------------------------------- streak (English)
export type Streak = { last: string | null; count: number; best: number; days: string[] };

export function loadStreak(): Streak {
  const s = readJSON<Streak>(KEYS.streak, { last: null, count: 0, best: 0, days: [] });
  // A streak survives until the end of the day after the last active day.
  if (s.last && daysBetween(s.last, dayKey()) > 1) return { ...s, count: 0 };
  return s;
}

export function markStudied(): Streak {
  const s = loadStreak();
  const today = dayKey();
  if (s.last === today) return s;
  const count = s.last && daysBetween(s.last, today) === 1 ? s.count + 1 : 1;
  const next = { last: today, count, best: Math.max(s.best, count), days: [...s.days.slice(-59), today] };
  writeJSON(KEYS.streak, next);
  return next;
}

export function resetAll() {
  [KEYS.design, KEYS.fsrs, KEYS.streak, KEYS.ui, KEYS.xp, KEYS.perf, KEYS.challenges, KEYS.slang, KEYS.writing].forEach(removeKey);
}
