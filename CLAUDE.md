# Claude Code Instructions — ClawTrad

This file guides future Claude Code sessions working on this project.

## Before Coding

Read these files first (in this order):
1. `PROJECT_BRIEF.md` — understand what we're building and why
2. `DECISIONS.md` — know what's been decided and why
3. `ROADMAP.md` — know what's planned next
4. `TECHNICAL_ARCHITECTURE.md` — understand the code structure
5. `MUSIC_ENGINE_NOTES.md` — understand musical rules and simplifications
6. `DATA_AND_RIGHTS.md` — understand legal/data constraints
7. `HANDOFF.md` — current status and known issues

## Coding Style

- Prefer small, incremental changes with clear commit messages
- Match existing code patterns (function naming, comment style, module structure)
- All music logic is pure functions in `src/music/` — no React dependency
- UI components are in `src/components/` — one component per file
- Keep arrangement engine deterministic (same input → same output)
- Document musical assumptions and limitations

## Project Rules

### DO NOT:
- Add scraping, crawlers, or automated tune downloading
- Add backend services, databases, or user accounts (v0.1)
- Add paid APIs or services requiring billing
- Bundle external tune databases or ABC collections
- Import from The Session without explicit permission to do so
- Claim the app produces perfect or definitive arrangements
- Make large aesthetic changes without asking
- Change the project's data/rights posture without discussion

### DO:
- Update `HANDOFF.md` after every meaningful change
- Update `DECISIONS.md` when making durable technical choices
- Run `npm test` before reporting completion
- Document musical simplifications in `MUSIC_ENGINE_NOTES.md`
- Use explicit, tested pitch data rather than inferring from notation
- Keep the user-pasted-ABC-only data model for v0.1

## Commands Reference

```bash
npm run dev        # Start dev server
npm test           # Run tests (vitest run)
npm run test:watch # Run tests in watch mode
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
```

## Architecture Quick Reference

```
ABC text → parseAbc() → arrangeMelody() → renderAsciiTab() → display
                ↓              ↓
           ParsedAbcTune   TabArrangement
```

Key modules:
- `music/abc/parseAbc.ts` — limited ABC parser
- `music/banjo/tunings.ts` — explicit MIDI pitch tables
- `music/banjo/fretboard.ts` — find positions within fret range
- `music/arranger/scoring.ts` — position scoring weights
- `music/arranger/arrangeMelody.ts` — main pipeline
- `music/arranger/clawhammer.ts` — drone logic
- `music/render/asciiTab.ts` — plain-text tab output
