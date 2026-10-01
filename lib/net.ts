import { AiError } from "./engines/errors";
import { sleep } from "./utils";

export type NetErrorKind = "offline" | "timeout" | "rate-limit" | "unavailable" | "not-found" | "bad-response" | "rejected";

export class NetError extends Error {
  constructor(
    public kind: NetErrorKind,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
  get retryable() {
    return this.kind === "timeout" || this.kind === "rate-limit" || this.kind === "unavailable" || this.kind === "offline";
  }
}

type Options = {
  timeoutMs?: number;
  /** Backoff schedule between attempts; length = number of retries. */
  backoff?: number[];
  init?: RequestInit;
};

/**
 * fetch + JSON with a hard timeout and bounded retries. It never hangs: after the last
 * attempt it throws a NetError whose `kind` drives the panel's error copy.
 */
export async function fetchJSON<T>(url: string, { timeoutMs = 15_000, backoff = [1_000, 3_000], init }: Options = {}): Promise<T> {
  let last: NetError | null = null;
  for (let attempt = 0; attempt <= backoff.length; attempt++) {
    if (attempt > 0) await sleep(backoff[attempt - 1]);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new NetError("offline", "You're offline.");
    }
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        try {
          return (await res.json()) as T;
        } catch {
          throw new NetError("bad-response", "The response wasn't valid JSON.", res.status);
        }
      }
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error ?? body?.message ?? "";
      } catch {
        /* no body */
      }
      if (res.status === 404) throw new NetError("not-found", detail || "Not found.", 404);
      if (res.status === 429) last = new NetError("rate-limit", detail || "Too many requests — slowing down.", 429);
      else if (res.status >= 500) last = new NetError("unavailable", detail || "The service didn't answer.", res.status);
      else throw new NetError("rejected", detail || `Request rejected (${res.status}).`, res.status);
    } catch (e) {
      if (e instanceof NetError && !e.retryable) throw e;
      if (e instanceof NetError) last = e;
      else if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) last = new NetError("timeout", "That took too long.");
      else last = new NetError(navigator.onLine === false ? "offline" : "unavailable", "Couldn't reach the service.");
    }
  }
  throw last ?? new NetError("unavailable", "Couldn't reach the service.");
}

export function describeError(e: unknown): { title: string; body: string } {
  if (e instanceof AiError) {
    const title = { setup: "AI isn't set up", key: "Check your Gemini key", quota: "Your key hit its limit", busy: "The AI is busy", blocked: "The AI declined that", invalid: "The AI's answer didn't check out", unsupported: "This device can't run that model" }[e.kind];
    return { title, body: e.message };
  }
  if (e instanceof NetError) {
    switch (e.kind) {
      case "offline":
        return { title: "You're offline", body: "This needs a connection. Anything you've already seen still works." };
      case "timeout":
        return { title: "That took too long", body: "The service is slow right now. Try again in a moment." };
      case "rate-limit":
        return { title: "Slow down a little", body: "We hit the free-tier rate limit. Wait a few seconds and try again." };
      case "not-found":
        return { title: "Nothing found", body: e.message };
      case "unavailable":
        return { title: "The service didn't answer", body: "It retried three times, then stopped. Try again shortly." };
      default:
        return { title: "Something went wrong", body: e.message };
    }
  }
  return { title: "Something went wrong", body: e instanceof Error ? e.message : "Unknown error." };
}
