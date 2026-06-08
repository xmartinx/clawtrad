# Handoff Notes — ClawTrad

## Current Status

**v0.2 — Rhythmic Tab Rendering Foundation complete.** TabDocument data model added. SVG visual tab renderer with rhythmic structure, rests, barlines, and drone markers. Plain text tab kept as fallback. 143 tests pass.

- **Branch:** `master`
- **Date:** 2025-06-08
- **Previous commit:** `9e925ef` — feat: improve abc parsing and arrangement reliability

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
 Test Files  8 passed (8)
      Tests  143 passed (143)
```

Test files:
- `src/music/__tests__/notes.test.ts` — MIDI conversion, pitchClass, note naming
- `src/music/__tests__/tunings.test.ts` — tuning definitions, open pitch tables
- `src/music/__tests__/fretboard.test.ts` — position finding, fret range
- `src/music/__tests__/arrangeMelody.test.ts` — melody arrangement, clawhammer, DP, warnings
- `src/music/__tests__/asciiTab.test.ts` — tab output shape and content
- `src/music/__tests__/abcParser.test.ts` — header parsing, key signatures, accidentals, octaves, warnings
- `src/music/__tests__/scoring.test.ts` — intrinsic scores, transitions, DP vs greedy, 5th-string avoidance
- `src/music/__tests__/tabDocument.test.ts` — rhythm events, measure separation, rests, drones, diagnostics (**new in v0.2**)

## What Changed in v0.2

### Tab document model (`src/music/tab/`)
- `tabLayoutTypes.ts` — TabDocument, TabMeasure, TabEvent, TabDiagnostics types
- `buildTabDocument.ts` — converts ParsedAbcTune + TabArrangement → TabDocument
- Pure data model, no React dependency
- Preserves rhythmic structure: notes, rests, barlines, drones

### Rhythm events (`src/music/abc/parseAbc.ts`, `types.ts`)
- Extended parser to emit `RhythmEvent[]` alongside notes
- Rhythm events capture notes, rests, and barlines in order
- Rest durations preserved from ABC

### Visual tab component (`src/components/VisualTab.tsx`)
- SVG rendering with 5 horizontal string lines
- String labels derived from tuning notation
- Fret numbers on correct strings, proportional to note duration
- Rest markers ("z"), skipped notes ("—"), drone markers ("d")
- Barlines between measures
- Title, tuning, mode, and diagnostics displayed

### UI integration (`src/app/App.tsx`)
- Visual tab as main output, plain text tab preserved as fallback
- `buildTabDocument` called in the generate pipeline

### Bug fix (`src/music/arranger/clawhammer.ts`)
- Fixed mutation bug: `hasDrone` was set on copied column objects that were then discarded

### Tests
- `tabDocument.test.ts` — 19 tests: rhythm events, measure separation, rests, drones, diagnostics, beat positions

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
3. **SVG tab has basic layout** — no note stems, beams, or proper engraving; proportional spacing but no fine rhythmic placement
4. **Rests shown as "z"** — no proper rest engraving symbols
5. **No line wrapping in SVG** — long tunes produce very wide SVGs
6. **Key signature subset** — flat keys beyond F and Bb, and some modal keys, generate a warning
7. **Seventh-fret ceiling** — notes requiring fret > 7 are skipped; no octave folding

## Next Recommended Task

**v0.2 refinements** — copy-to-clipboard for plain text tab, SVG responsive width/line-wrapping, tuning recommendation, or improved drone placement patterns. See `ROADMAP.md` for full v0.2 scope.

Alternatively:
- **Jig support (v0.3)** — extend drone logic for 6/8 rhythm
- **Editable tab** — click to change string/fret assignments

## Last Completed Task

v0.2 Rhythmic Tab Rendering Foundation: TabDocument model, SVG visual tab renderer, rhythm events, rest preservation, drone event fix, 143 tests. Commit pending.

