"use client";

import { createContext, useCallback, useContext, useEffect, useEffectEvent, useRef, useState, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { describeError } from "@/lib/net";
import { pronounce, speak } from "@/lib/speech";
import { cx } from "@/lib/utils";

// ------------------------------------------------------------------ buttons
type Variant = "primary" | "ink" | "strong" | "quiet" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-olive text-on-olive border-olive hover:bg-olive-deep hover:border-olive-deep",
  ink: "bg-ink text-on-ink border-ink hover:opacity-90",
  strong: "bg-card text-ink border-ink hover:bg-soft",
  quiet: "bg-card text-graphite border-line hover:border-muted hover:text-ink",
  ghost: "bg-transparent text-graphite border-transparent hover:text-ink",
};

// React 19: `ref` is a normal prop on function components, so ComponentProps carries it through.
export function Btn({ variant = "quiet", size = "md", className, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? "h-9 px-3 text-[12px]" : size === "lg" ? "h-[52px] px-5 text-sm" : "h-11 px-4 text-[13px]";
  return (
    <button
      type="button"
      {...rest}
      className={cx("tap press inline-flex items-center justify-center gap-2 rounded-[4px] border font-medium disabled:cursor-not-allowed disabled:opacity-40", h, VARIANTS[variant], className)}
    />
  );
}

export function IconBtn({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx("tap press grid h-11 w-11 shrink-0 place-items-center rounded-[4px] border border-rule bg-transparent text-graphite hover:border-line hover:text-ink disabled:opacity-40", className)}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ segmented control
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  tone = "olive",
  size = "md",
  label,
  className,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  tone?: "olive" | "ink";
  size?: "sm" | "md";
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cx("grid overflow-hidden rounded-[4px] border border-ink", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o, i) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={cx(
              "tap press truncate px-2 font-sans",
              size === "sm" ? "h-10 text-[13px]" : "h-[46px] text-sm",
              i > 0 && "border-l border-ink",
              on ? (tone === "olive" ? "bg-olive font-medium text-on-olive" : "bg-ink font-medium text-on-ink") : "bg-card text-ink hover:bg-soft",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...rest}
      className={cx(
        "tap press h-[34px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[12px]",
        active ? "border-ink bg-ink font-medium text-on-ink" : "border-line bg-card text-graphite hover:border-muted hover:text-ink",
        className,
      )}
    />
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "olive" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-medium",
        tone === "olive" ? "border-olive-line bg-olive-tint text-olive-ink" : "border-line text-graphite",
      )}
    >
      {children}
    </span>
  );
}

export const Label = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cx("label-caps", className)}>{children}</span>;

/** Provenance line: every panel that touches the network says where its words came from. */
export const Source = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cx("text-[10px] leading-snug text-muted", className)}>{children}</p>;

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-[2px] w-full bg-rule", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-olive transition-[width] duration-300 ease-out" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

// ------------------------------------------------------------------ icons (inline stroke, never emoji)
const I = ({ d, size = 18, className, sw = 2 }: { d: ReactNode; size?: number; className?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    {d}
  </svg>
);
export const Icon = {
  check: (p: { size?: number; className?: string }) => <I {...p} sw={2.5} d={<path d="m5 13 4 4L19 7" />} />,
  cross: (p: { size?: number; className?: string }) => <I {...p} sw={2.4} d={<path d="M18 6 6 18M6 6l12 12" />} />,
  left: (p: { size?: number; className?: string }) => <I {...p} d={<path d="m15 18-6-6 6-6" />} />,
  right: (p: { size?: number; className?: string }) => <I {...p} d={<path d="m9 18 6-6-6-6" />} />,
  speaker: (p: { size?: number; className?: string }) => <I {...p} d={<><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a9 9 0 0 1 0 14" /></>} />,
  bulb: (p: { size?: number; className?: string }) => <I {...p} d={<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />} />,
  sun: (p: { size?: number; className?: string }) => <I {...p} sw={1.8} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>} />,
  moon: (p: { size?: number; className?: string }) => <I {...p} sw={1.8} d={<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />} />,
  send: (p: { size?: number; className?: string }) => <I {...p} d={<path d="M5 12h14M13 6l6 6-6 6" />} />,
  shuffle: (p: { size?: number; className?: string }) => <I {...p} d={<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />} />,
  alert: (p: { size?: number; className?: string }) => <I {...p} d={<><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></>} />,
  offline: (p: { size?: number; className?: string }) => <I {...p} d={<path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3.5-2.3M19 12.9a10 10 0 0 0-6.5-2.8M1.4 9.3a15 15 0 0 1 4.6-2.9M22.6 9.3a15 15 0 0 0-10.4-3.2M12 20h.01" />} />,
  lock: (p: { size?: number; className?: string }) => <I {...p} d={<><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>} />,
  spark: (p: { size?: number; className?: string }) => <I {...p} d={<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" />} />,
  refresh: (p: { size?: number; className?: string }) => <I {...p} d={<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></>} />,
};

// ------------------------------------------------------------------ audio
export function SpeakBtn({ text, audio, label, variant = "quiet", size = 44 }: { text: string; audio?: string | null; label?: string; variant?: "olive" | "quiet" | "inline"; size?: number }) {
  const onClick = () => (audio !== undefined ? pronounce(text, audio) : speak(text));
  if (variant === "inline")
    return (
      <button type="button" onClick={onClick} aria-label={label ?? `Hear “${text}”`} className="tap press inline-grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:text-ink">
        <Icon.speaker size={14} />
      </button>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? `Hear “${text}”`}
      style={{ width: size, height: size }}
      className={cx("tap press grid shrink-0 place-items-center rounded-full border", variant === "olive" ? "border-olive bg-olive text-on-olive hover:bg-olive-deep" : "border-line bg-card text-ink hover:border-muted")}
    >
      <Icon.speaker size={size > 44 ? 19 : 17} />
    </button>
  );
}

// ------------------------------------------------------------------ async states
export function Skeleton({ lines = 3, title = true, className }: { lines?: number; title?: boolean; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-3.5", className)} aria-busy="true" aria-label="Loading">
      {title && <div className="skeleton h-8 w-3/5" />}
      {title && <div className="flex items-center gap-2.5"><div className="skeleton h-3.5 w-24" /><div className="skeleton h-5 w-16 rounded-full" /></div>}
      {title && <div className="h-px bg-rule" />}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3.5" style={{ width: `${[100, 78, 46, 88, 64][i % 5]}%` }} />
      ))}
    </div>
  );
}

export function ErrorPanel({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const { title, body } = describeError(error);
  const offline = error instanceof Error && "kind" in error && (error as { kind: string }).kind === "offline";
  return (
    <div role="alert" className={cx("pop flex flex-col gap-2.5 border border-rule border-l-[3px] border-l-ink bg-card", compact ? "p-3.5" : "p-5")}>
      <div className="flex items-center gap-2">
        {offline ? <Icon.offline size={17} /> : <Icon.alert size={17} />}
        <span className="text-[14px] font-medium">{title}</span>
      </div>
      <p className="font-serif text-[15px] leading-relaxed text-graphite">{body}</p>
      {onRetry && (
        <div>
          <Btn variant="ink" size="sm" onClick={onRetry}>
            Try again
          </Btn>
        </div>
      )}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="pop flex flex-col items-center gap-2.5 border border-dashed border-line bg-card px-6 py-10 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-olive-tint text-olive-ink">
        <Icon.check size={19} />
      </div>
      <p className="text-[15px] font-medium">{title}</p>
      <p className="max-w-xs font-serif text-[15px] leading-relaxed text-graphite">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function StaleNote({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="text-[11px] text-muted">Showing a saved copy — the live source didn&apos;t answer.</p>;
}

// ------------------------------------------------------------------ async hook
export type Async<T> = { status: "idle" | "loading" | "ready" | "error"; data?: T; error?: unknown; stale?: boolean };

// Answers outlive the component that asked: leave a tab and come back, and the content
// is still there — no skeleton, no second request. Loads still running when you leave
// keep going and land here too.
const settled = new Map<string, { value: unknown; stale: boolean }>();
const inflight = new Map<string, Promise<{ value: unknown; stale: boolean }>>();
const SETTLED_MAX = 400;

function remember(key: string, r: { value: unknown; stale: boolean }) {
  settled.delete(key);
  settled.set(key, r);
  if (settled.size > SETTLED_MAX) settled.delete(settled.keys().next().value!);
}

/**
 * Runs `load` when `key` changes (or on retry) and ignores late answers from an earlier
 * key. Status is derived from which key the stored result belongs to, so the effect
 * never has to reset state synchronously — it only sets state when an answer arrives.
 * Results are remembered per key for the session, so remounting renders them at once.
 */
export function useAsync<T>(key: string | null, load: () => Promise<{ value: T; stale: boolean }>) {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{ tag: string; state: Async<T> } | null>(null);
  const run = useEffectEvent(load);
  const tag = key == null ? null : `${key}#${nonce}`;
  const memo = key != null && nonce === 0 ? (settled.get(key) as { value: T; stale: boolean } | undefined) : undefined;

  useEffect(() => {
    if (tag == null || key == null) return;
    if (nonce === 0 && settled.has(key)) return;
    let live = true;
    let pending = inflight.get(tag);
    if (!pending) {
      pending = run();
      inflight.set(tag, pending);
      const clear = () => inflight.delete(tag);
      pending.then((r) => { remember(key, r); clear(); }, clear);
    }
    pending.then(
      (r) => live && setResult({ tag, state: { status: "ready", data: r.value as T, stale: r.stale } }),
      (error) => live && setResult({ tag, state: { status: "error", error } }),
    );
    return () => {
      live = false;
    };
  }, [tag]); // eslint-disable-line react-hooks/exhaustive-deps -- tag encodes key + nonce

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  if (tag == null) return { status: "idle" as const, retry };
  if (result?.tag === tag) return { ...result.state, retry };
  if (memo) return { status: "ready" as const, data: memo.value, stale: memo.stale, retry };
  return { status: "loading" as const, retry };
}

/**
 * useState that survives leaving the tab: the value lives for the session under `key`,
 * so a quiz round, drill set or chosen topic is where you left it when you come back.
 */
const sessionValues = new Map<string, unknown>();
/** Preset a session value before its screen mounts — e.g. open Grammar at a given topic. */
export const setSessionValue = (key: string, value: unknown) => void sessionValues.set(key, value);
export function useSessionState<T>(key: string, init: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    if (sessionValues.has(key)) return sessionValues.get(key) as T;
    const v = typeof init === "function" ? (init as () => T)() : init;
    sessionValues.set(key, v);
    return v;
  });
  const set = useCallback(
    (next: T | ((prev: T) => T)) =>
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        sessionValues.set(key, v);
        return v;
      }),
    [key],
  );
  return [value, set] as const;
}

// ------------------------------------------------------------------ toast
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className={cx("pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-opacity duration-200", msg ? "opacity-100" : "opacity-0")}>
        {msg && <div className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-on-ink shadow-lg">{msg}</div>}
      </div>
    </ToastCtx.Provider>
  );
}
