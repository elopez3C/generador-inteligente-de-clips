# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

There is no test runner or linter configured in this project.

## Environment

Copy `.env.local` and set `GEMINI_API_KEY` to a real Gemini API key. Vite exposes it as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (see `vite.config.ts`).

## Architecture

**This is a React 19 SPA built with Vite + TypeScript.** Despite the folder name, this is NOT a Remix framework app.

- **Tailwind CSS** is loaded via CDN in `index.html` — there is no `tailwind.config.js` or PostCSS setup. Do not add a Tailwind config file.
- **No routing library** — navigation is handled by a `Screen` enum (`types.ts`) with a `currentScreen` state in `App.tsx` that conditionally renders the active screen component.
- **No global state management** — all state lives in `App.tsx` and is passed down as props. There is no Context, Redux, or Zustand.
- **No persistence** — all clip/session data is in-memory React state. Refreshing the page resets everything.
- **`@` path alias** resolves to the project root (configured in `vite.config.ts`).

## Screen Flow

```
UPLOAD → INITIAL_PROCESSING → PREVIEW ⇄ RE_ANALYSIS
                                  ↓
                              GENERATING → RESULTS
                                                ↓
                                           LIBRARY
```

- `App.tsx` owns the two main data arrays: `activeClips` (current analysis session) and `generatedClips` (the persistent library/history).
- `activeClips` is populated by `ProcessingScreen` (via mock data currently) and cleared after generation completes.
- `generatedClips` accumulates across sessions and is what `LibraryScreen` and `ResultsScreen` display.

## Current State: All AI is Mocked

**The Gemini API is not yet integrated.** `ProcessingScreen` uses a hardcoded `mockClips` array and a timed simulation instead of real API calls. The UI references "Gemini 2.5 Pro" but no `@google/generative-ai` package is installed. When integrating the real API, the call should replace the `useEffect` timer in `ProcessingScreen.tsx` and `GenerationScreen.tsx`.

## Key Files

- `types.ts` — All shared types: `Clip`, `AnalysisParams`, `Screen`, `FileData`, `TranscriptLine`
- `App.tsx` — Root component, owns all state, defines `DEFAULT_PARAMS`, orchestrates screen transitions
- `screens/ProcessingScreen.tsx` — Contains the mock `mockClips` array that simulates AI output
- `screens/PreviewScreen.tsx` — Contains mock `mockTranscriptGrouped` inline; has three tabs (Resumen, Clips, Transcripción) and a sticky generation bar
- `components/ClipCard.tsx` — Renders both AI-suggested clips and manual clips; manual clips show `isManual: true` and amber styling
