// localStorage that never throws: private mode, quota, disabled storage and SSR
// all degrade to "nothing stored" instead of breaking the app.

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function keysWithPrefix(prefix: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
    return out;
  } catch {
    return [];
  }
}

export const KEYS = {
  ui: "lp.ui.v1",
  theme: "lp.theme",
  design: "lp.design.v1",
  fsrs: "lp.en.fsrs.v1",
  streak: "lp.en.streak.v1",
  xp: "lp.xp.v1",
  perf: "lp.perf.v1",
  challenges: "lp.challenges.v1",
  slang: "lp.slang.v1",
  writing: "lp.writing.v1",
  legacy: "designprep.v1", // the single-file app's progress, migrated once
} as const;
