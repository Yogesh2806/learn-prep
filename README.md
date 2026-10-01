# Learn Prep

A study app for product-design interview prep and everyday English — installable as a PWA on phone or laptop, and usable offline.

**Design** — 85 flashcards, a quiz and type-the-term recall across KPIs & metrics, product design, PM, business, revenue and interview frameworks.

**English**
- **Word of the Day** — a well-known-but-fuzzy word each day, with audio, everyday examples and a 10-second check.
- **Vocabulary** — flashcards scheduled with FSRS spaced repetition, a quiz with look-alike distractors, and recall.
- **Tenses** — how the 12 tenses work, a conjugation trainer for any verb (offline) and drills.
- **Grammar & Punctuation** — curated rule cards (where to apply it, the common mistake, a check) plus a fix-the-punctuation drill.
- **Writing Arena** — rewrite challenges and free writing, scored with targeted feedback and a cleaner rewrite.
- **Gen Z Slang** — a hand-written, safe deck with a daily batch and a quiz.
- **Doubt Solver** — paste a sentence for explained corrections, or ask any grammar question.
- **Challenges** — XP and levels, a daily challenge, a weekly boss quiz and weak-spot practice.

## How content works

Facts are fixed, teaching is fresh. Definitions come from dictionaries (with a saved snapshot), rules and answer keys are curated, and an AI layer adds examples and feedback. Teaching that doesn't need to be live is pre-generated into `lib/baked-ai.json` and served from `/api/baked`, so most screens load instantly for everyone; every AI panel has a fallback when no model is available.

## Bring your own AI

There is no shared key. In **Settings**, each learner picks an engine:

- **Your Gemini key**: a free key from Google AI Studio, stored only in that browser and sent straight to Google. The server never sees it.
- **Chrome built-in AI**: Gemini Nano through Chrome's Prompt API, on the device.
- **Model in your browser**: Qwen2.5 1.5B run with WebLLM and WebGPU, downloaded once (about 1 GB).

All three use the same prompts, schemas and validators (`lib/ai-tasks.ts`). If one engine fails, any other engine that's set up is tried. Settings also has **What to study**: Design, English or both.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and add an engine in Settings. `GEMINI_API_KEY` in `.env.local` is only used by `npm run bake`.

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm test` | Conjugation, curated-lesson and their/they're checks |
| `npm run bake` | Pre-generate AI teaching content (resumable; respects free-tier quotas) |
| `npm run snapshot:words` | Refresh the saved dictionary snapshot for the word pool |
| `npm run pick:senses` | Pick the everyday sense of each pool word |

## Deploying

Deploy on Vercel. No environment variables are needed: the server makes no model calls.

Built with Next.js 16, React 19, Tailwind CSS 4, WebLLM, ts-fsrs, compromise, LanguageTool, Free Dictionary API, Wiktionary and Datamuse.
