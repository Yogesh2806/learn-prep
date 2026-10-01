import { chromeAvailability } from "./engines/chrome";
import { KEYS, readJSON, writeJSON } from "./storage";

// Which AI engine answers. Learn Prep has no shared key: each learner picks one of
//   • gemini — their own free Gemini key, sent from this browser straight to Google;
//   • chrome — Chrome's built-in model, on the device;
//   • webllm — an open model downloaded into the browser.
// Everything here stays in this browser's storage. Pre-generated lessons and all the
// curated content work with any choice, including none.

export type EngineId = "gemini" | "chrome" | "webllm";
export type AiSettings = {
  /** The preferred engine; null = never chosen (use whatever is ready); "off" = no live AI. */
  engine: EngineId | "off" | null;
  key: string;
  /** The in-browser model has finished downloading on this device. */
  webllmReady: boolean;
};

const DEFAULTS: AiSettings = { engine: null, key: "", webllmReady: false };

export const ENGINE_LABEL: Record<EngineId, string> = {
  gemini: "Gemini · your key",
  chrome: "Chrome built-in AI · on this device",
  webllm: "Qwen2.5 1.5B · in this browser",
};

let current: AiSettings | null = null;
const listeners = new Set<() => void>();

export function getAiSettings(): AiSettings {
  current ??= { ...DEFAULTS, ...readJSON<Partial<AiSettings>>(KEYS.ai, {}) };
  return current;
}

export function setAiSettings(patch: Partial<AiSettings>) {
  current = { ...getAiSettings(), ...patch };
  writeJSON(KEYS.ai, current);
  listeners.forEach((l) => l());
}

export function subscribeAiSettings(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Engines that can answer right now, the preferred one first. */
export async function readyEngines(): Promise<EngineId[]> {
  const s = getAiSettings();
  if (s.engine === "off") return [];
  const ready: EngineId[] = [];
  if (s.key) ready.push("gemini");
  if ((await chromeAvailability()) === "available") ready.push("chrome");
  if (s.webllmReady) ready.push("webllm");
  return s.engine && ready.includes(s.engine) ? [s.engine, ...ready.filter((e) => e !== s.engine)] : ready;
}

// ------------------------------------------------------------------ opening the panel
const OPEN = "lp:open-settings";
export const openSettings = () => window.dispatchEvent(new Event(OPEN));
export function onOpenSettings(fn: () => void) {
  window.addEventListener(OPEN, fn);
  return () => window.removeEventListener(OPEN, fn);
}
