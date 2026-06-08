# Music Engine Notes — ClawTrad

## Banjo Tuning Definitions

String numbering: 1 = closest to floor (highest melody string), 5 = short thumb/drone string.

### Open G (gDGBD)

| String | Note | MIDI |
|--------|------|------|
| 1 | D4 | 62 |
| 2 | B3 | 59 |
| 3 | G3 | 55 |
| 4 | D3 | 50 |
| 5 | G4 | 67 |

### Double D (aDADE)

| String | Note | MIDI |
|--------|------|------|
| 1 | E4 | 64 |
| 2 | D4 | 62 |
| 3 | A3 | 57 |
| 4 | D3 | 50 |
| 5 | A4 | 69 |

### Sawmill A (aEADE)

| String | Note | MIDI |
|--------|------|------|
| 1 | E4 | 64 |
| 2 | D4 | 62 |
| 3 | A3 | 57 |
| 4 | E3 | 52 |
| 5 | A4 | 69 |

## Note / Fret Mapping Rules

- Internal pitch representation: MIDI note numbers (middle C = 60)
- Fret = pitch − open_string_pitch
- Only frets 0–7 are considered valid for v0.1
- If no valid position exists, a warning is emitted and the note is skipped (rest inserted)

## Arrangement Scoring Rules

Each candidate (string, fret) position is scored. Higher score = better.

| Rule | Weight | Explanation |
|------|--------|-------------|
| Prefer lower frets | +3 per fret below 7 | Easier left hand |
| Prefer open strings | +4 bonus | Open strings ring and are idiomatic |
| Prefer melody strings (1–3) | +5 bonus | Strings 1–3 are traditional melody strings |
| Avoid 5th string for melody | −20 penalty | 5th string is a drone, not a melody string |
| Avoid fret jumps | −2 per fret | Smooth left hand |
| Avoid string jumps | −1 per string | Smooth right hand |
| Stay on same string | +2 bonus | Consistent tone |

Selection is **dynamic programming (Viterbi-style)**: the algorithm finds the globally lowest-cost (string, fret) path through the entire melody. This produces smoother fingerings than the original greedy approach. The DP naturally segments around gaps (unplayable notes).

## Accidental and Key Signature Handling (v0.1.1)

- Key-signature accidentals are applied by default to all matching note letters
- Explicit accidentals (`^`, `_`, `=`, `^^`, `__`) override the key signature
- Natural sign (`=`) cancels the key-signature accidental for that note occurrence
- Standalone accidentals before a note (e.g., `^F`) apply to the immediately following note only
- Unknown or unsupported key signatures generate a warning but do not crash

## Octave Handling (v0.1.1)

- Uppercase letters: base octave = 4 (middle-C octave)
- Lowercase letters: base octave = 5 (one octave higher)
- Apostrophe (`'`): raise one octave
- Comma (`,`): lower one octave
- Multiple markers stack: `C,,` = C2, `c''` = C7

## Clawhammer Mode

In basic clawhammer mode, the melody-only path is taken and simple 5th-string drone markers are added on strong beats (beats 1 and 3 in 4/4). The drone is marked by showing the 5th string as open (fret 0) in columns that already contain a melody note.

## Rhythmic Tab Rendering (v0.2)

The TabDocument model preserves rhythmic structure from ABC input:
- Notes and rests are interleaved in order as `RhythmEvent[]`
- Barlines separate measures; each `TabMeasure` resets beat position
- Event durations scale horizontal spacing in the SVG renderer
- Rests appear as "z" markers; skipped notes as "—"

Current rhythmic simplifications:
- No tuplet-aware spacing
- No dotted-note visual distinction beyond proportional width
- No tie/slur rendering
- SVG does not line-wrap; very long tunes produce very wide output

## Current Simplifications

- **No chords**: All input is treated as monophonic melody
- **No ornamentation**: Rolls, cuts, triplets, slides, hammer-ons, pull-offs are not processed
- **No drop-thumb**: Right-hand patterns are not modeled
- **No brush**: Only single-note melody with optional drone
- **4/4 only**: Other time signatures are parsed but drone logic assumes 4/4
- **ABC parser limitations**:
  - No chords / multi-voice (detected, warned, skipped)
  - No grace notes (detected, warned, skipped)
  - No tuplets (detected, warned, skipped)
  - No decorations (detected, warned, skipped)
  - No ties or slurs
  - No broken rhythm markers (detected, warned)
  - No inline key/meter changes
- **Key signature limitations**: Dorian/mixolydian key signatures use standard music-theory conventions. Some Irish trad transcribers use non-standard key signatures for modal tunes, which may produce unexpected accidentals.

## Known Musical Limitations

1. **DP is heuristic**: Transition costs are based on simplified weights, not ergonomic hand modelling. The optimal path may differ from what an experienced player would choose.
2. **No capo logic**: Tunings are treated as-is; no virtual capo positions
3. **No string bending or alternate tunings beyond the 3 defined**
4. **Drone placement is simplistic**: Only strong beats receive drones; real clawhammer uses more varied patterns
5. **5th string fretting**: The 5th string can theoretically be fretted (positions will be found) but is heavily penalised and should not appear in practice for v0.1 input ranges
6. **Octave folding**: Notes outside the 0–7 fret range are skipped rather than octave-shifted. This may cause melody notes to be dropped for tunes with wide range.
7. **Modal key signatures**: Our key-signature mappings follow standard music theory. Some Irish ABC collections use non-standard key signatures for dorian/mixolydian tunes (e.g., K:Ador with 2 sharps instead of 1). This may cause occasional accidental mismatches.
