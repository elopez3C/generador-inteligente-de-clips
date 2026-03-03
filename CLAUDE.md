# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
npx tsc --noEmit   # Type-check without emitting
```

There is no test runner or linter configured in this project.

## Deployment

- **Vercel**: https://generador-inteligente-de-clips.vercel.app/
- Deploys automatically from `main` branch
- Workflow: develop on `dev`, then `git push --force origin dev:main` to deploy

## Environment

Copy `.env.local` and set `GEMINI_API_KEY` to a real Gemini API key. Vite exposes it as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (see `vite.config.ts`).

## Architecture

**This is a React 19 SPA built with Vite + TypeScript + MUI (Material UI).** Despite the folder name, this is NOT a Remix framework app.

- **Source files live at project root** — `App.tsx`, `components/`, `screens/`, `types.ts`, `utils.ts`, `mockData.ts`. There is no `src/` directory.
- **Tailwind CSS** is loaded via CDN in `index.html` — there is no `tailwind.config.js` or PostCSS setup. Do not add a Tailwind config file.
- **No routing library** — navigation is handled by a `Screen` enum (`types.ts`) with a `screen` state in `App.tsx` that conditionally renders the active screen component.
- **No global state management** — all state lives in `App.tsx` and is passed down as props. There is no Context, Redux, or Zustand.
- **No persistence** — all clip/session data is in-memory React state. Refreshing the page resets everything.
- **`@` path alias** resolves to the project root (configured in `vite.config.ts`).

## Screen Flow

```
LIBRARY (default screen) ←→ WORKSPACE
     ↑                            ↑
     └─── UploadDialog ───────────┘
```

Only two screens: `Screen.WORKSPACE` and `Screen.LIBRARY`.

- `App.tsx` owns two main data arrays: `clips` (active workspace session) and `generatedClips` (the persistent library).
- Upload triggers mock analysis (3.2s timer) → auto-saves clips to library → navigates to Library project detail.
- `LibraryScreen` shows projects grouped by `sourceVideoName`. Each project has a detail view with clips, editing, re-analysis, and manual clip creation.

## Current State: All AI is Mocked

**The Gemini API is not yet integrated.** Analysis uses hardcoded `MOCK_ANALYSIS_CLIPS` from `mockData.ts` with a timed simulation. The UI references "Gemini 2.5 Pro" but no `@google/generative-ai` package is installed. When integrating the real API, replace the `setTimeout` in `App.tsx` `handleStart()`.

## Key Files

- `types.ts` — All shared types: `Clip`, `AnalysisParams`, `Screen`, `TranscriptGroup`, `TranscriptLine`, `LibraryFolder`, `FileData`
- `App.tsx` — Root component, owns all state, orchestrates screen transitions and data flow
- `mockData.ts` — `MOCK_ANALYSIS_CLIPS`, `MOCK_TRANSCRIPT` (18 speaker groups), `MOCK_LIBRARY_CLIPS`
- `utils.ts` — `formatDuration()` (seconds → "M:SS") and `parseDuration()` ("M:SS" → seconds)
- `screens/WorkspaceScreen.tsx` — Analysis workspace with transcription/video modes
- `screens/LibraryScreen.tsx` — Library with project list, project detail, folder views
- `components/ClipEditorDialog.tsx` — Fullscreen clip editor (video + transcript + range slider + search)
- `components/CapCutEditor.tsx` — Fullscreen manual clip creator (same layout as ClipEditorDialog)
- `components/TranscriptionModePanel.tsx` — Transcript-based clip browsing with inline editing

## UI Patterns

- Dark theme dialogs: `bgcolor: '#1a1a2e'`
- Purple accent: `#7c5cbf`
- Range highlighting in transcripts: green for in-range, green border for start line, red border for end line
- Search highlight: yellow background on matching text, non-matching lines dimmed
- Flag buttons appear on hover to set clip start/end from transcript lines
