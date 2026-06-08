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

Selection is **greedy**: each note's best position is chosen based on the previous note's selected position. This is not globally optimal but produces reasonable results and is deterministic.

## Clawhammer Mode

In basic clawhammer mode, the melody-only path is taken and simple 5th-string drone markers are added on strong beats (beats 1 and 3 in 4/4). The drone is marked by showing the 5th string as open (fret 0) in columns that already contain a melody note.

## Current Simplifications

- **No chords**: All input is treated as monophonic melody
- **No ornamentation**: Rolls, cuts, triplets, slides, hammer-ons, pull-offs are not processed
- **No drop-thumb**: Right-hand patterns are not modeled
- **No brush**: Only single-note melody with optional drone
- **No rhythmic variation**: Durations are parsed but not used for arrangement decisions
- **4/4 only**: Other time signatures are parsed but drone logic assumes 4/4
- **Greedy selection**: Not globally optimal; may miss better overall fingerings
- **ABC parser limitations**:
  - No chords / multi-voice (`[CEG]` brackets ignored)
  - No grace notes (`{...}`)
  - No tuplets (`(3abc`)
  - No decorations (`!...!`)
  - No ties or slurs
  - No broken rhythm markers (`<` `>`)
  - No inline key/meter changes

## Known Musical Limitations

1. **Position selection is local**: The greedy algorithm may pick a sequence that is suboptimal over a longer phrase
2. **No capo logic**: Tunings are treated as-is; no virtual capo positions
3. **No string bending or alternate tunings beyond the 3 defined**
4. **Drone placement is simplistic**: Only strong beats receive drones; real clawhammer uses more varied patterns
5. **5th string fretting**: The 5th string can theoretically be fretted (positions will be found) but is heavily penalised and should not appear in practice for v0.1 input ranges
6. **Octave folding**: Notes outside the 0–7 fret range are skipped rather than octave-shifted. This may cause melody notes to be dropped for tunes with wide range.
