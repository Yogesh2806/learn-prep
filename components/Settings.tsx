"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { getAiSettings, setAiSettings, subscribeAiSettings, type EngineId } from "@/lib/ai-settings";
import { SYSTEM_INSTRUCTION } from "@/lib/ai-tasks";
import { chromeAvailability, chromePrepare } from "@/lib/engines/chrome";
import { AiError } from "@/lib/engines/errors";
import { testKey } from "@/lib/engines/gemini";
import { cx } from "@/lib/utils";
import { useStore, type Sections } from "./store";
import { Btn, Icon, IconBtn, Label, Segmented, useToast } from "./ui";

// Settings: what to study (Design, English or both) and which AI engine answers.
// There is no shared key — each learner brings their own Gemini key or runs a model on
// their own device. The key lives only in this browser and is sent only to Google.

export default function Settings({ onClose }: { onClose: () => void }) {
  const { ui, setUI } = useStore();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);

  const sections = ui.sections ?? "both";
  const setSections = (s: Sections) => setUI(s === "both" ? { sections: s } : { sections: s, subject: s });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Close settings" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        className="pop relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-rule bg-paper outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-paper/95 px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3 backdrop-blur">
          <h2 id="settings-title" className="text-[18px] font-medium tracking-[-0.02em]">Settings</h2>
          <IconBtn label="Close settings" onClick={onClose}>
            <Icon.cross size={16} />
          </IconBtn>
        </div>

        <div className="flex flex-col gap-7 px-5 py-5 pb-[max(28px,env(safe-area-inset-bottom))]">
          <section className="flex flex-col gap-2.5">
            <Label>What to study</Label>
            <Segmented
              label="What to study"
              tone="ink"
              value={sections}
              onChange={setSections}
              options={[
                { id: "design", label: "Design" },
                { id: "english", label: "English" },
                { id: "both", label: "Both" },
              ]}
            />
            <p className="text-[12px] leading-snug text-muted">
              {sections === "both" ? "Switch between Design and English from the top of the app." : `Only ${sections === "design" ? "Design" : "English"} is shown. Your progress in the other stays saved.`}
            </p>
          </section>

          <AiEngines />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ AI engines
type ChromeState = "checking" | "unavailable" | "downloadable" | "downloading" | "available";
type WebState = "checking" | "unsupported" | "absent" | "downloading" | "ready";

function AiEngines() {
  const s = useSyncExternalStore(subscribeAiSettings, getAiSettings, getAiSettings);
  const toast = useToast();
  const [chrome, setChrome] = useState<ChromeState>("checking");
  const [chromePct, setChromePct] = useState(0);
  const [web, setWeb] = useState<WebState>("checking");
  const [webProgress, setWebProgress] = useState({ pct: 0, text: "" });
  const [error, setError] = useState<{ engine: EngineId; text: string } | null>(null);

  useEffect(() => {
    let live = true;
    chromeAvailability().then((a) => live && setChrome(a));
    import("@/lib/engines/webllm")
      .then((m) => m.webllmModelId())
      .then((id) => live && setWeb(!id ? "unsupported" : getAiSettings().webllmReady ? "ready" : "absent"));
    return () => {
      live = false;
    };
  }, []);

  const ready: Record<EngineId, boolean> = { gemini: !!s.key, chrome: chrome === "available", webllm: web === "ready" && s.webllmReady };
  const active: EngineId | "off" | null = s.engine === "off" ? "off" : s.engine && ready[s.engine] ? s.engine : (["gemini", "chrome", "webllm"] as const).find((e) => ready[e]) ?? null;
  const choose = (engine: EngineId | "off") => setAiSettings({ engine });

  async function downloadChrome() {
    setError(null);
    setChrome("downloading");
    try {
      await chromePrepare(SYSTEM_INSTRUCTION, (f) => setChromePct(Math.round(f * 100)));
      setChrome("available");
      choose("chrome");
      toast("Chrome's built-in AI is ready");
    } catch (e) {
      setChrome(await chromeAvailability());
      setError({ engine: "chrome", text: e instanceof Error ? e.message : "Couldn't start Chrome's built-in AI." });
    }
  }

  async function downloadWeb() {
    setError(null);
    setWeb("downloading");
    try {
      const m = await import("@/lib/engines/webllm");
      await m.webllmLoad((pct, text) => setWebProgress({ pct: Math.round(pct * 100), text }));
      setAiSettings({ webllmReady: true, engine: "webllm" });
      setWeb("ready");
      toast("The in-browser model is ready");
    } catch (e) {
      setWeb("absent");
      setError({ engine: "webllm", text: e instanceof Error ? e.message : "The download didn't finish." });
    }
  }

  async function removeWeb() {
    const m = await import("@/lib/engines/webllm");
    await m.webllmRemove();
    setAiSettings({ webllmReady: false, ...(s.engine === "webllm" ? { engine: null } : {}) });
    setWeb("absent");
    toast("Model removed from this device");
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label>AI engine</Label>
        <p className="font-serif text-[14.5px] leading-relaxed text-graphite">
          Learn Prep doesn&apos;t share an AI key. Pick how the AI parts — feedback, explanations, fresh examples — run for you. Curated lessons and pre-generated content work either way.
        </p>
      </div>

      <EngineCard
        title="Your Gemini key"
        badge="Best quality"
        selected={active === "gemini"}
        canSelect={ready.gemini}
        onSelect={() => choose("gemini")}
        status={s.key ? `Key saved · ending ${s.key.slice(-4)}` : "No key yet"}
      >
        <GeminiKey
          saved={!!s.key}
          onSaved={() => {
            setError(null);
            toast("Key works — Gemini is on");
          }}
          onError={(text) => setError({ engine: "gemini", text })}
        />
        {error?.engine === "gemini" && <ErrorLine text={error.text} />}
      </EngineCard>

      <EngineCard
        title="Chrome built-in AI"
        badge="Free · on this device"
        selected={active === "chrome"}
        canSelect={ready.chrome}
        onSelect={() => choose("chrome")}
        status={
          { checking: "Checking this browser…", unavailable: "Not available in this browser", downloadable: "Available — Chrome needs to download it", downloading: `Chrome is downloading the model… ${chromePct}%`, available: "Ready on this device" }[chrome]
        }
      >
        <p className="text-[12.5px] leading-snug text-muted">
          Gemini Nano, built into desktop Chrome. Private and works offline. Chrome downloads the model once (a few GB) and shares it across sites. A little less sharp than cloud Gemini.
        </p>
        {chrome === "unavailable" && <p className="text-[12.5px] leading-snug text-muted">Needs a recent desktop Chrome on a computer with enough memory and storage. Phones aren&apos;t supported yet.</p>}
        {chrome === "downloadable" && (
          <Btn variant="strong" size="sm" className="w-fit" onClick={downloadChrome}>
            Set up Chrome&apos;s AI
          </Btn>
        )}
        {chrome === "downloading" && <Bar pct={chromePct} />}
        {error?.engine === "chrome" && <ErrorLine text={error.text} />}
      </EngineCard>

      <EngineCard
        title="Model in your browser"
        badge="Free · works anywhere with WebGPU"
        selected={active === "webllm"}
        canSelect={ready.webllm}
        onSelect={() => choose("webllm")}
        status={{ checking: "Checking this browser…", unsupported: "This browser doesn't support WebGPU", absent: "Not downloaded", downloading: "Downloading…", ready: "Downloaded · ready on this device" }[web]}
      >
        <p className="text-[12.5px] leading-snug text-muted">
          Qwen2.5 1.5B, an open model, downloaded once (about 1 GB) and run on your GPU. Nothing leaves your device. It&apos;s the smallest option: good for examples and memory hooks, less reliable at grading writing.
        </p>
        {web === "absent" && (
          <Btn variant="strong" size="sm" className="w-fit" onClick={downloadWeb}>
            Download the model · about 1 GB
          </Btn>
        )}
        {web === "downloading" && (
          <div className="flex flex-col gap-1.5">
            <Bar pct={webProgress.pct} />
            <span className="truncate text-[11px] text-muted">{webProgress.text || "Starting…"}</span>
          </div>
        )}
        {web === "ready" && (
          <Btn variant="quiet" size="sm" className="w-fit" onClick={removeWeb}>
            Remove from this device
          </Btn>
        )}
        {error?.engine === "webllm" && <ErrorLine text={error.text} />}
      </EngineCard>

      <EngineCard title="No live AI" selected={active === "off" || active === null} canSelect onSelect={() => choose("off")} status={active === null ? "Nothing set up yet" : "AI features are off"}>
        <p className="text-[12.5px] leading-snug text-muted">Flashcards, quizzes, drills, the grammar checker and every pre-generated lesson still work. Writing scores and the Doubt Solver&apos;s answers need an engine.</p>
      </EngineCard>

      <p className="text-[11.5px] leading-snug text-muted">
        If one engine fails, Learn Prep tries any other engine you&apos;ve set up. Every AI answer is checked before it&apos;s shown, and each AI panel says which engine wrote it.
      </p>
    </section>
  );
}

function EngineCard({ title, badge, status, selected, canSelect, onSelect, children }: { title: string; badge?: string; status: string; selected: boolean; canSelect: boolean; onSelect: () => void; children?: ReactNode }) {
  return (
    <div className={cx("flex flex-col gap-3 border bg-card p-4", selected ? "border-ink" : "border-rule")}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={!canSelect}
        onClick={onSelect}
        className="tap flex items-start gap-3 text-left disabled:cursor-default"
      >
        <span className={cx("mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2", selected ? "border-olive" : "border-line")}>
          {selected && <span className="h-2 w-2 rounded-full bg-olive" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-medium">{title}</span>
            {badge && <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-olive-ink">{badge}</span>}
          </span>
          <span className="text-[12px] text-muted">{status}</span>
        </span>
      </button>
      {children && <div className="flex flex-col gap-2.5 pl-[30px]">{children}</div>}
    </div>
  );
}

function GeminiKey({ saved, onSaved, onError }: { saved: boolean; onSaved: () => void; onError: (text: string) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!saved);

  async function save() {
    const key = value.trim();
    if (!key || busy) return;
    setBusy(true);
    try {
      await testKey(key);
      setAiSettings({ key, engine: "gemini" });
      setValue("");
      setEditing(false);
      onSaved();
    } catch (e) {
      onError(e instanceof AiError ? e.message : "Couldn't check that key.");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap gap-2">
        <Btn variant="quiet" size="sm" onClick={() => setEditing(true)}>Replace key</Btn>
        <Btn variant="quiet" size="sm" onClick={() => setAiSettings({ key: "", ...(getAiSettings().engine === "gemini" ? { engine: null } : {}) })}>Remove key</Btn>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[12.5px] leading-snug text-muted">
        Get a free key at{" "}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-olive-ink underline underline-offset-2">Google AI Studio</a>
        . It&apos;s stored only in this browser and sent only to Google — never to Learn Prep&apos;s server.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label htmlFor="gemini-key" className="sr-only">Gemini API key</label>
        <input
          id="gemini-key"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste your key"
          className="h-11 min-w-0 flex-1 rounded-[4px] border border-line bg-paper px-3 font-mono text-[13px] outline-none focus:border-olive"
        />
        <Btn type="submit" variant="primary" disabled={!value.trim() || busy}>{busy ? "Testing…" : "Save & test"}</Btn>
      </form>
      <p className="text-[11.5px] leading-snug text-muted">
        Tip: in Google Cloud&apos;s credentials page, restrict the key to this website ({typeof location !== "undefined" ? location.host : "this site"}) so it&apos;s useless anywhere else.
      </p>
    </div>
  );
}

const Bar = ({ pct }: { pct: number }) => (
  <div className="h-[3px] bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
    <div className="h-full bg-olive transition-[width]" style={{ width: `${pct}%` }} />
  </div>
);

const ErrorLine = ({ text }: { text: string }) => (
  <p role="alert" className="flex gap-1.5 text-[12.5px] leading-snug text-ink">
    <Icon.alert size={14} className="mt-0.5 shrink-0" />
    {text}
  </p>
);
