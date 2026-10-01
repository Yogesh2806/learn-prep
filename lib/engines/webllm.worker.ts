import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Runs the in-browser model off the main thread, so the app stays responsive while it thinks.
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent) => handler.onmessage(msg);
