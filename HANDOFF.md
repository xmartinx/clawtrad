# Handoff Notes — ClawTrad

## Current Status

**v0.1 — MVP complete.** Working prototype with ABC parsing, three tunings, melody-to-tab arrangement, and plain-text tab output. All 54 unit tests pass.

- **Branch:** `master`
- **Latest commit:** `94476ae` — fix: remove unused parseTuning import in tunings test
- **Date:** 2025-06-08

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint
```

## Tests Status

```
 Test Files  5 passed (5)
      Tests  54 passed (54)
```

Test files:
- `src/music/__tests__/notes.test.ts` — MIDI conversion, pitchClass, note naming
- `src/music/__tests__/tunings.test.ts` — tuning definitions, open pitch tables
- `src/music/__tests__/fretboard.test.ts` — position finding, fret range
- `src/music/__tests__/arrangeMelody.test.ts` — melody arrangement, clawhammer mode
- `src/music/__tests__/asciiTab.test.ts` — tab output shape and content

## Files Changed (from initial scaffold)

### New files (from scratch)
Everything in `src/` was created new for ClawTrad:
- `src/music/abc/types.ts`, `parseAbc.ts`
- `src/music/theory/notes.ts`, `keys.ts`
- `src/music/banjo/tunings.ts`, `fretboard.ts`, `tabTypes.ts`
- `src/music/arranger/arrangeMelody.ts`, `scoring.ts`, `clawhammer.ts`
- `src/music/render/asciiTab.ts`
- `src/music/__tests__/notes.test.ts`, `tunings.test.ts`, `fretboard.test.ts`, `arrangeMelody.test.ts`, `asciiTab.test.ts`
- `src/components/AbcInput.tsx`, `TuningSelector.tsx`, `ModeSelector.tsx`, `NotationPreview.tsx`, `TabOutput.tsx`, `WarningPanel.tsx`
- `src/app/App.tsx`
- `src/test-fixtures/simple-d-reel.abc`, `simple-g-reel.abc`

### Modified files
- `package.json` — added test scripts, dependencies
- `vite.config.ts` — added Vitest configuration
- `index.html` — updated title
- `src/main.tsx` — updated App import path
- `src/index.css` — full restyle for ClawTrad UI
- `.gitignore` — added coverage, cache, env entries

### Removed files
- `src/App.tsx` (scaffold default, replaced by `src/app/App.tsx`)
- `src/App.css` (scaffold default, replaced by updated `src/index.css`)

### Documentation files (all new)
- `README.md`, `PROJECT_BRIEF.md`, `TECHNICAL_ARCHITECTURE.md`
- `MUSIC_ENGINE_NOTES.md`, `DATA_AND_RIGHTS.md`, `ROADMAP.md`
- `DECISIONS.md`, `HANDOFF.md`, `CLAUDE.md`

## Known Issues

1. **ABC parser is deliberately limited** — see `MUSIC_ENGINE_NOTES.md` for full list. Chords, grace notes, tuplets, decorations, and multi-voice ABC will not parse correctly.
2. **Position selection is greedy** — may produce suboptimal fingerings over longer phrases. A look-ahead or Viterbi-style algorithm would improve results.
3. **Drone placement is simplistic** — only beats 1 and 3 in 4/4 get drones. No off-beat or syncopated drone patterns.
4. **No note duration in tab rendering** — all tab columns are rendered with equal spacing regardless of note length.
5. **`abcjs` import may need type declarations** — if TypeScript complains about the abcjs import, a `@types/abcjs` package may be needed.
6. **Rests (`z`) are parsed but dropped** — they cause the duration accumulator to advance but produce no tab output, which may cause alignment issues in some tunes.
7. **Key signature handling is basic** — only handles natural+sharp keys up to 4 sharps. Flat keys and modal key signatures need more work.

## Next Recommended Task

**Better tab rendering** — SVG or HTML canvas rendering of tab with proper note stems, beams, and drone markers. This is the most visible improvement for v0.2.

Alternatively:
- **Improve position selection** — implement a 2-note look-ahead or full dynamic programming approach
- **Add jig support** — extend parser and drone logic for 6/8 time
- **Add more ABC features** — handle grace notes (as skipped+warned), basic chords (arpeggiated)

## Last Completed Task

Full v0.1 MVP: project scaffold, music engine, UI components, tests, and documentation. Commit pending.
