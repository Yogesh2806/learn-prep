// Web Speech API for examples and words without a recorded pronunciation.

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (voice || typeof window === "undefined" || !("speechSynthesis" in window)) return voice;
  const voices = window.speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang === "en-US" && /natural|premium|enhanced|samantha|google us/i.test(v.name)) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null;
  return voice;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, rate = 0.95) {
  if (!canSpeak()) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-US";
  u.rate = rate;
  window.speechSynthesis.speak(u);
  return true;
}

/** Recorded audio first (the dictionary's human recording), synthesis as fallback. */
export async function pronounce(word: string, audioUrl?: string | null) {
  if (audioUrl) {
    try {
      await new Audio(audioUrl).play();
      return;
    } catch {
      /* blocked or offline — fall back */
    }
  }
  speak(word, 0.9);
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    voice = null;
    pickVoice();
  };
}
