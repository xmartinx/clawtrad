# Handoff Notes — ClawTrad

## Current Status

**v0.1.1 — Arrangement Engine Reliability Pass complete.** ABC parser significantly improved with proper accidental/key-signature/octave handling. Dynamic-programming global-path arrangement replaces greedy selection. Warning and diagnostic coverage expanded. 124 unit tests pass.

- **Branch:** `master`
- **Date:** 2025-06-08
- **Previous commit:** `d70a5f8` — docs: update HANDOFF.md with commit hash and date

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
 Test Files  7 passed (7)
      Tests  124 passed (124)
```

Test files:
- `src/music/__tests__/notes.test.ts` — MIDI conversion, pitchClass, note naming
- `src/music/__tests__/tunings.test.ts` — tuning definitions, open pitch tables
- `src/music/__tests__/fretboard.test.ts` — position finding, fret range
- `src/music/__tests__/arrangeMelody.test.ts` — melody arrangement, clawhammer, DP, warnings
- `src/music/__tests__/asciiTab.test.ts` — tab output shape and content
- `src/music/__tests__/abcParser.test.ts` — header parsing, key signatures, accidentals, octaves, warnings (**new in v0.1.1**)
- `src/music/__tests__/scoring.test.ts` — intrinsic scores, transitions, DP vs greedy, 5th-string avoidance (**new in v0.1.1**)

## What Changed in v0.1.1

### ABC parser (`src/music/abc/parseAbc.ts`)
- Full inline accidental support: `^` (sharp), `^^` (double sharp), `_` (flat), `__` (double flat), `=` (natural)
- Accidental prefix form (accidental before note) works correctly
- Explicit accidentals override key-signature accidentals
- Natural sign cancels key-signature accidental for that note
- Improved unsupported-feature detection with specific warnings:
  - Grace notes `{…}`
  - Chords in quotes `"…"` and brackets `[…]`
  - Decorations `!…!`
  - Tuplets `(3…`
  - Broken rhythm `< >`
  - Multiple voices `V:`
- `skippedTokens` counter in ParsedAbcTune for diagnostics
- Better tokenizer with cleaner regex construction

### Key signatures (`src/music/abc/types.ts`)
- Expanded KEY_SIGNATURES with correct music-theory mappings
- Added: `Dmix` (D mixolydian), `Ddor` (D dorian), `Bm` (B minor)
- Fixed `Ador` to 1 sharp (was incorrectly 3)
- Unknown key signatures generate a clear warning listing supported keys

### Dynamic Programming arrangement (`src/music/arranger/scoring.ts`, `arrangeMelody.ts`)
- Replaced greedy position selection with Viterbi-style DP global-path optimisation
- `findOptimalPath()` finds minimum-cost (string, fret) path across entire melody
- Split scoring into `intrinsicScore()` (position merit) and `transitionScore()` (movement cost)
- Original `scorePosition()` and `selectBestPosition()` preserved for backward compat
- DP naturally segments around unplayable notes (restarts after gaps)
- Complexity: O(N × K²) where K ≤ 5 candidates per note — negligible in practice

### Diagnostics and warnings (`src/app/App.tsx`, `src/index.css`)
- Diagnostic summary bar showing: key, tuning, mode, note count, unplayable count
- Improved warning aggregation — parser and arranger warnings combined
- Updated footer version to v0.1.1

### Tests (124 total, up from 54)
- `abcParser.test.ts` — 32 new tests covering headers, key sigs, accidentals, octaves, warnings, note/rest counts
- `scoring.test.ts` — 15 new tests covering intrinsic scores, transitions, DP vs greedy, 5th-string avoidance, note ordering
- `arrangeMelody.test.ts` — added DP-specific tests (global optimisation, 5th-string avoidance, warning aggregation)

## Known Issues

1. **ABC parser is limited to monophonic melody** — chords, multi-voice, grace notes, tuplets detected and warned but not parsed
2. **Drone placement is simplistic** — only beats 1 and 3 in 4/4 get drones
3. **No note duration in tab rendering** — all tab columns equal width regardless of duration
4. **Rests skipped** — they advance duration but produce no tab column, may cause rhythmic misalignment
5. **Key signature subset** — flat keys beyond F and Bb, and some modal keys, generate a warning
6. **DP is deterministic but not perfect** — transition costs are based on heuristics, not ergonomic hand modelling
7. **Seventh-fret ceiling** — notes requiring fret > 7 are skipped; no octave folding

## Next Recommended Task

**Better tab rendering (v0.2)** — SVG or HTML canvas rendering with proper note stems, beams, and drone markers. The arrangement engine is now reliable enough to invest in presentation.

Alternatively:
- **Jig support (v0.3)** — extend drone logic for 6/8 rhythm
- **Tuning recommendation** — suggest best tuning based on tune key and range
- **Editable tab** — click to change string/fret assignments

## Last Completed Task

v0.1.1 Arrangement Engine Reliability Pass: parser overhaul, DP arrangement, expanded key signatures, diagnostics, 124 tests. Commit pending.

