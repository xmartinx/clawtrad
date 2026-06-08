# ClawTrad

**Turn Irish ABC notation into playable clawhammer banjo tab.**

Paste an Irish tune. Choose a tuning. Get a clawhammer tab starting point.

## Current Status

**v0.2 — Rhythmic Tab Rendering Foundation.** SVG visual tab with rhythmic structure (notes, rests, barlines, drone markers). Plain-text tab fallback. Dynamic-programming arrangement engine. 143 tests.

## Quick Start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## How to Test

```bash
npm test
```

## MVP Limits

- Monophonic melody only (one note at a time)
- Simple 4/4 reels only (jigs coming in v0.3)
- Keys: D, G, A modal, E minor (as far as practical)
- Frets 0–7 only
- User-pasted ABC only — no file imports, no tune database
- Plain-text tab output (fancy rendering in v0.2)
- No audio playback

## Tech Stack

- React 19 + TypeScript + Vite
- abcjs for standard notation preview
- Custom arrangement engine (TypeScript)
- Vitest for testing
- No backend, no paid APIs

## Documentation

- [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) — vision, target users, non-goals
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) — stack, data flow, folder structure
- [MUSIC_ENGINE_NOTES.md](./MUSIC_ENGINE_NOTES.md) — tunings, scoring rules, simplifications
- [DATA_AND_RIGHTS.md](./DATA_AND_RIGHTS.md) — data policy and legal posture
- [ROADMAP.md](./ROADMAP.md) — version plans
- [DECISIONS.md](./DECISIONS.md) — durable technical decisions log
- [HANDOFF.md](./HANDOFF.md) — current status for next developer
- [CLAUDE.md](./CLAUDE.md) — instructions for Claude Code sessions
