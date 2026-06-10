# Handoff Notes — ClawTrad

## Current Status

**v0.2.21 — Actual Browser Stem Elements and Meter Spacing Polish.** Project parked for later resumption.

Key features at park:
- SVG visual tab with 5-line staff, measure numbers, time signature, final barline
- Beat-pair beaming [0,1][2,3][4,5][6,7] with 3px beams (currentColor)
- Quarter-note drone fill in clawhammer mode (offbeat slots only)
- Stems: per-measure grouped, 3-way queryable, 6px beam penetration
- Double C, Open G, Double D, Sawmill A tunings with pitch anchoring
- Tuning letter labels, chord labels (display-only)
- Meter-aware: 4/4 → 8 slots, 2/4 → 4 slots
- Tolerant ABC parser (comments, missing headers, accidentals)
- DP arrangement with same-string pair preference
- Basic Clawhammer default mode, plain-text tab removed from UI

- **Branch:** `master`
- **Commit:** `ec96764`
- **Date:** 2025-06-10
- **Tests:** 331 passed (19 files)
- **Build:** succeeds
- **Pushed:** yes

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

## Project Parked

Full resume instructions: `docs/project_parking_handoff.md`

Quick resume:
```powershell
cd D:\Appbuilds\ClawTrad
npm run dev -- --force
# Ctrl+Shift+R in browser
# Run DevTools checks from parking doc
```

## Next Recommended Task (When Resuming)

1. **Verify v0.2.21 browser QA** — hard refresh, run DevTools stem queries.
2. If stems queryable: **H/P/Sl label rendering** — render H/P/Sl between paired fret numbers. `assignPairRoles()` in `clawhammer.ts` computes candidates.
3. If stems still fail: investigate jsdom vs browser render path; clear Vite cache (`rm -r node_modules/.vite`).

## Last Completed Task

v0.2.21: Fixed stem queryability bug (per-measure event grouping). Stems 3-way queryable, penetration 6px, time sig 22px. 331 tests. Commit `ec96764`.


