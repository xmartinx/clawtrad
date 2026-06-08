# Technical Architecture — ClawTrad

## Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 19 (functional components, hooks) |
| Language | TypeScript (strict mode) |
| Build tool | Vite 8 |
| Testing | Vitest 4 + jsdom |
| Notation rendering | abcjs 6 |
| Backend | None (v0.1) |
| Paid APIs | None |

## Folder Structure

```
src/
  app/
    App.tsx                    # Main application component
  music/
    abc/
      types.ts                 # ParsedAbcTune, AbcNote, key signature map
      parseAbc.ts              # Limited ABC parser (v0.1 subset)
    theory/
      notes.ts                 # MIDI conversion, pitchClass, note naming
      keys.ts                  # Irish key/mode definitions
    banjo/
      tunings.ts               # Tuning definitions and open-pitch tables
      fretboard.ts             # Position finder (string+fret → pitch)
      tabTypes.ts              # TabColumn, TabCell, OutputMode types
    arranger/
      arrangeMelody.ts         # Main melody-to-tab pipeline
      scoring.ts               # Position scoring function
      clawhammer.ts            # Basic drone-adding logic
    render/
      asciiTab.ts              # Plain-text ASCII tab renderer
    __tests__/                 # Unit tests (co-located)
  components/
    AbcInput.tsx               # ABC paste textarea
    TuningSelector.tsx         # Tuning dropdown
    ModeSelector.tsx           # Melody-only vs clawhammer mode
    NotationPreview.tsx        # abcjs standard notation render
    TabOutput.tsx              # Tab text display
    WarningPanel.tsx           # Parser/arranger warnings
  test-fixtures/
    simple-d-reel.abc          # Sample D major reel
    simple-g-reel.abc          # Sample G major reel
```

## Data Flow

```
ABC text input
  → parseAbc() → ParsedAbcTune { title, keySignature, notes[] }
    → arrangeMelody(tune, tuning, mode)
      → findPositions() per note → candidates[]
      → selectBestPosition(candidates, prev) → FretPosition
      → (if clawhammer) addBasicClawhammerDrones()
    → TabArrangement { columns[], warnings[] }
  → renderAsciiTab(arrangement, tuning) → plain text
→ TabOutput component displays text
```

## Arrangement Engine Overview

1. **Parse**: ABC text → `ParsedAbcTune` with normalized MIDI pitches and durations
2. **Position finding**: For each note, find all (string, fret) positions within 0–7 frets
3. **Scoring**: Score each candidate against musical priorities (lower frets, open strings, minimal jumps)
4. **Selection**: Greedy best-position selection (each note depends on previous)
5. **Drone**: (Clawhammer mode only) Add 5th-string drone markers on strong beats
6. **Render**: Format as plain-text tab mimicking standard banjo tab layout

## Why No Backend Yet

- All processing is local and CPU-light (no ML, no large datasets)
- MVP serves a single user at a time with no persistence
- Avoiding backend keeps deployment trivial (static hosting)
- User accounts, saved arrangements, and tune libraries are future features

## Why No Scraping / Importing Yet

- Legal caution: ABC tune databases have unclear licensing
- The Session's terms of use must be reviewed before integration
- MVP focus is on the arrangement engine, not data acquisition
- User-pasted ABC avoids all copyright and attribution issues
