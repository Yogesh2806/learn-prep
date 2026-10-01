// One error type for every AI engine, so panels can say something useful: "add a key",
// "your key was rejected", "the model is busy", rather than a generic failure.

export type AiErrorKind =
  | "setup" // no engine is set up, or AI is switched off
  | "key" // the learner's Gemini key was rejected
  | "quota" // free-tier limit on the learner's key
  | "busy" // overloaded, unreachable or timed out
  | "blocked" // a safety filter refused
  | "invalid" // the answer didn't pass the task's checks
  | "unsupported"; // this device can't run the engine

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string,
    public retryable = kind === "busy" || kind === "quota" || kind === "invalid",
  ) {
    super(message);
  }
}
