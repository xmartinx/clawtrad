# ClawTrad Tab Notation Specification — v0.2.5

ClawTrad produces **Brainjo-style beginner/intermediate clawhammer banjo tab**.
This document defines the notation elements that ClawTrad aims to produce and
tracks which are currently implemented.

## Staff and Strings

- 5 full-length horizontal tab lines.
- **Top line** = 1st string (closest to floor).
- **2nd line** = 2nd string.
- **3rd line** = 3rd string.
- **4th line** = 4th string.
- **Bottom line** = 5th string (short thumb/drone string).

The 5th string line is full-length like standard printed tab. It is not
visually shortened.

## Left Labels

Tuning letters at the left of each system, displayed top-to-bottom
matching the tab lines (string 1 → string 5).

Example for Open G (gDGBD):
```
D  |--- ...
B  |--- ...
G  |--- ...
D  |--- ...
g  |--- ...
```

The 5th string label is lowercase to indicate the high drone.

Labels are clear single letters, not broken vertical text.

## Fret Numbers

- Fret numbers appear on the correct string line.
- 0 = open string.
- Frets 1–10 may appear on strings 1 and 2.
- Frets 1–7 may appear on strings 3 and 4.
- The 5th string only ever shows open "0" (drone-only).

## 5th String Rule (v1)

For ClawTrad v1, **the 5th string is open-drone-only**.

- It may show only open "0".
- It must never show fretted melody notes.
- This is a product rule, not a temporary limitation.
- Even if some melodic clawhammer styles allow fretted 5th string,
  ClawTrad v1 does not.

## Measure Numbers

- Small numbers at the start of each wrapped system/line.
- Only the first measure of each system is numbered.
- No large measure numbers above every measure.

## Chord Labels

- Show chord labels above the staff when present in ABC (e.g., `"D"`, `"G"`).
- Chords are **display-only** — they do not affect the arrangement.
- Future: chords may trigger brush/strum events.

## Rests

- Rests are shown with a rest symbol (𝄽) centred in the tab.
- Rests consume proportional horizontal space.
- Rest events arise from explicit ABC rests (`z`) or from notes that
  have no playable position in the selected tuning.

## Skipped / Missed Notes

- ClawTrad does **not** use "x" markers for missed/skipped notes in
  normal tab output.
- When the engine cannot place a melody note, it becomes a rest.
- Future: intentional clawhammer skip-notes (right-hand motion without
  sounding the string) will use parentheses style, e.g. `(1)`.

## Rhythm Stems and Beams

- Stems appear below the tab.
- 4/4 reels are grouped by beat: [1 &] [2 &] [3 &] [4 &].
- Short notes (eighth-note duration) within the same beat are beamed
  together.
- No beams across barlines.
- No beams through rests.
- Long notes (quarter or longer) are not beamed.

## Left-Hand Techniques (future)

- Hammer-on: "H" between two fret numbers on the same string
- Pull-off: "P" or "Po" between two fret numbers on the same string
- Slide: "Sl" between two fret numbers on the same string
- These are deferred to a future version.

## Right-Hand Labels (future)

- M = melody note (frailing finger)
- T = thumb (drop-thumb or drone)
- Hidden by default; reserved for a future instructional mode.

## Deferred Notation Elements

| Element | Status |
|---------|--------|
| Hammer-on / pull-off labels | Future |
| Slide markers | Future |
| Drop-thumb T labels | Hidden by default |
| Brush / strum markers | Future |
| Parentheses for skip notes | Future |
| D.C. / D.S. / repeats | Future |
| Double stops / chords | Future |
