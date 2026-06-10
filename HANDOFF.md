# Handoff Notes — ClawTrad

## Current Status

**v0.2.18 — Real Stem Geometry and Beam Length Correction complete.** Beams render FIRST (stems on top). Stems extend 5px past beam centre for visible tips. Beam width exactly spans pair stems. Beam height 3px. Right barline pad 14px. 330 tests pass. Stems extend 3px past beam centre for guaranteed overlap. Beam height reduced to 4px. Asymmetric barline padding (8px left, 12px right). 330 tests pass. Beam height reduced to 5px. Barline inner padding (6px) added. Stem-to-beam geometry uses consistent beamY computation. 330 tests pass. Split-measure beam grouping fixes tabBeamCount=0 bug. All three manual QA ABCs now produce correct beam counts (8/8/4). 330 tests pass. App integration tests prove default ABC produces beams. Beams/stems/barlines now share consistent currentColor styling. Diagnostic data attributes on SVG root. 324 tests pass. DOM render tests prove beams exist in SVG with valid attributes. Beams now #ccc fill in dedicated `<g>`. Basic Clawhammer is default mode. Plain-text tab section removed from UI. "Strong beat" drone wording corrected. 318 tests pass. Beams use hardcoded #888 fill and are rendered from beamPrimitives calculator. Drones use same font size/weight as fret numbers. 311 tests pass. Beams use explicit CSS var fill and data-testid. Rhythm grid is meter-aware (2/4→4 slots, 4/4→8 slots). Beat grouping dynamically adapts to meter. 303 tests pass. Beams now use filled `<rect>` for guaranteed visibility. Open string 1 attraction reduced for pair-context second-slot notes. Full-bar c d pair verified same-string. 286 tests pass. Beams now visible for melody+drone pairs. Same-string close moves (sameStringClose=8) preferred over open-string jumps for second-slot melody notes. 285 tests pass. Slot-grid debug module for exact assertions. buildTabDocument walks columns+rhythm in lockstep — drone columns correctly emitted as events. 274 tests pass (18 new slot-grid tests). Drone fill only in empty offbeat slots. Full quaver bars get zero drones. Beat-pair beaming [0,1][2,3][4,5][6,7]. Conservative drop-thumb (adjacent N+1 only). Same-string H/P/Sl candidates. 256 tests pass. Beat preservation fixed (quarter notes span 2 eighth slots). Double C wired end-to-end (notation as canonical tuning ID). Stems reach from note position down to beam. 232 tests pass. Double C tuning added. Pitch anchoring via per-tuning offset. No x markers in normal output. Tuning letter labels. Rhythm grid and beaming model. Three new spec docs. 213 tests pass. Visual tab now includes measure numbers, time signature, skipped "x" markers, rhythm stems, chord labels (display-only), and improved layout. 195 tests pass.

- **Branch:** `master`
- **Date:** 2025-06-08
- **Previous commit:** `4205708` — feat: improve abc compatibility and warnings

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
 Test Files  10 passed (10)
      Tests  184 passed (184)
```

Test files:
- `src/music/__tests__/notes.test.ts` — MIDI conversion, pitchClass, note naming
- `src/music/__tests__/tunings.test.ts` — tuning definitions, open pitch tables
- `src/music/__tests__/fretboard.test.ts` — position finding, fret range
- `src/music/__tests__/arrangeMelody.test.ts` — melody arrangement, clawhammer, DP, warnings
- `src/music/__tests__/asciiTab.test.ts` — tab output shape and content
- `src/music/__tests__/abcParser.test.ts` — header parsing, key signatures, accidentals, octaves, warnings
- `src/music/__tests__/scoring.test.ts` — intrinsic scores, transitions, DP vs greedy, 5th-string avoidance
- `src/music/__tests__/tabDocument.test.ts` — rhythm events, measure separation, rests, drones, diagnostics (v0.2)
- `src/music/__tests__/tabLayout.test.ts` — layout wrapping, multi-system, barline placement (v0.2.1)
- `src/music/__tests__/abcCompat.test.ts` — parser tolerance, comments, warnings, messy ABC (**new in v0.2.2**)

## What Changed in v0.2.1

### SVG line wrapping (`src/music/tab/tabLayout.ts`, `src/components/VisualTab.tsx`)
- New `tabLayout.ts`: pure `computeLayout()` function wraps measures into `TabSystem[]`
  when content exceeds max width (default 780px)
- Each `TabSystem` has its own 5 string lines, string labels, barlines, and events
- Measures kept whole unless a single measure exceeds system width
- Deterministic, testable layout calculations — no React dependency
- `VisualTab.tsx` rewritten to render multiple SVG `<g>` groups per system

### Copy to clipboard (`src/components/TabOutput.tsx`)
- "Copy plain text tab" button added above plain text tab
- Uses `navigator.clipboard.writeText()` API
- Shows "Copied!" feedback for 2 seconds
- Degrades gracefully if Clipboard API unavailable

### Print styling (`src/index.css`)
- `@media print` rules: hide controls, header, footer, and input sections
- Force white background, black text
- Preserve tab output sections with `page-break-inside: avoid`

### Bug fix
- `src/app/App.tsx` footer version updated from v0.1.1 to v0.2.1

### Tests
- `tabLayout.test.ts` — 13 tests: multi-system wrapping, measure order, event order,
  barline placement, duration-based spacing, rest/skip positioning, max width

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
5. **No line wrapping within a measure** — if a single measure is wider than the system, it overflows rather than being split
6. **Key signature subset** — flat keys beyond F and Bb, and some modal keys, generate a warning
7. **Seventh-fret ceiling** — notes requiring fret > 7 are skipped; no octave folding

## Next Recommended Task

**v0.3 — Jig Support**: extend rhythm and drone logic for 6/8 time, add jig test fixtures, update TabDocument and visual tab for compound meter. See `ROADMAP.md`.

Alternatively:
- **Tuning recommendation** — suggest best tuning based on tune key and range
- **Editable tab** — click to change string/fret assignments

## Last Completed Task

v0.2.3 Banjo Tab Engraving Style Pass: measure numbers, time signature, skipped "x" markers, rhythm stems, chord labels (display-only), 195 tests, style reference doc. Commit pending.


