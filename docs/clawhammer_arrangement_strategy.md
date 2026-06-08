# Clawhammer Arrangement Strategy — ClawTrad v0.2.5

ClawTrad is a **playable arrangement assistant**, not a definitive tune
authority. It produces first-pass clawhammer banjo tab that a musician
is expected to review, adjust, and personalise.

## Default Arrangement Feel

The default target is **intermediate melodic clawhammer**:
- Preserve Irish melody where practical.
- Keep the arrangement playable in clawhammer style.
- Prioritise open strings and lower frets.
- Allow higher frets (8–10) on strings 1–2 when musically useful.

## ABC-to-Banjo Pitch Anchoring

Each tuning carries a `pitchOffset` that shifts ABC pitches into the
banjo's natural range (typically −12 semitones, one octave down):

| Tuning | 4th String | ABC Anchor | Offset |
|--------|-----------|------------|--------|
| Open G (gDGBD) | D3 | Uppercase D → open 4th | −12 |
| Double C (gCGCD) | C3 | Uppercase C → open 4th | −12 |
| Double D (aDADE) | D3 | Uppercase D → open 4th | −12 |
| Sawmill A (aEADE) | E3 | E → open 4th | −12 |

This ensures normal Irish ABC range sits naturally on strings 1–4.

## Fretboard Rules

| String | Max Fret | Role |
|--------|---------|------|
| 1 | 10 | Melody |
| 2 | 10 | Melody |
| 3 | 7 | Melody |
| 4 | 7 | Melody |
| 5 | 0 only | Drone only |

- 5th string is **open-drone-only** for ClawTrad v1.
- No fretted 5th-string melody under any circumstances.
- Frets 8–10 on strings 1–2 are acceptable when musically useful.
- Large jumps to/from frets 8–10 are penalised in scoring.

## Position Scoring Priorities

1. **Open strings first** — strong bonus for fret 0.
2. **Lower frets second** — linear bonus per fret below 10.
3. **Avoid large jumps** — penalty per fret of jump, extra penalty
   for jumps > 3 frets, penalty for string changes.
4. **Weak middle-string preference** — small bonus for strings 2–4,
   mild penalty for string 1. This does not override open-string
   or low-fret advantages.

## Dynamic Programming

Position selection uses Viterbi-style DP that finds the globally
lowest-cost (string, fret) path through the entire melody. This is
deterministic — same input always produces the same output.

## 5th-String Drones

In basic clawhammer mode, drones are added on strong beats (1 and 3
in 4/4). Drone events are **open 0 on the 5th string only**.

## Drop-Thumb (future)

Drop-thumb should be used whenever it helps preserve important Irish
melody notes. Right-hand role for drop-thumb notes is "T" (thumb)
on inner strings.

Data model support: the rhythm grid (`clawhammerRhythmGrid.ts`) has
a `role` field per slot ready for future M/T labelling.

For v0.2.5, drop-thumb is not yet implemented as arrangement logic.

## Brushes / Strums (future)

When chords are present in ABC and rhythmically appropriate, ClawTrad
should eventually add brush/strum events. Chord labels already display
above the tab. The rhythm grid supports a `brush` role.

## Left-Hand Techniques (future)

Auto-suggest:
- **Hammer-on (H)**: confident rising same-string moves (e.g., 0→2)
- **Pull-off (P)**: confident descending same-string moves (e.g., 2→0)
- **Slide (Sl)**: likely same-string moves (e.g., 2→4)

Show only when highly confident. Ignore alternate-string techniques
for now.

## Warnings and Diagnostics

- Unplayable notes generate a warning and become rests in the tab.
- The tab header shows key, meter, and tuning only — no note/rest counts.
- Diagnostics (measure count, system count, warnings) appear below the tab.
