# Tab Style Reference — ClawTrad

This document describes the target visual style for ClawTrad's tab output
and tracks which elements are currently implemented.

## Target Visual Style

ClawTrad aims for readable clawhammer banjo tab that a player can use
immediately. The target style is:

- **5-line tab systems** with string labels at left
- **Barlines** through all five strings
- **Measure numbers** at the start of each wrapped system
- **Time signature** at the start of the first system
- **Fret numbers** on the correct strings
- **Rhythm stems** below the tab showing note duration
- **Chord labels** above measures/events (display-only, not used in arrangement)
- **Skipped/unplayable notes** shown as "x" on the expected string
- **Rests** shown as "z" with horizontal space
- **Drone markers** (5th string) shown as "d"
- **Multi-system wrapping** for long tunes

## Implemented Elements (v0.2.3)

| Element | Status | Notes |
|---------|--------|-------|
| 5-line tab systems | ✅ | SVG, 22px string spacing |
| String labels | ✅ | Extracted from tuning notation |
| Barlines | ✅ | Through all 5 strings |
| Measure numbers | ✅ | At start of each system |
| Time signature | ✅ | Stacked text at first system |
| Fret numbers | ✅ | Bold, centred on correct string |
| Skipped "x" markers | ✅ | On expected string (defaults to string 3) |
| Rest "z" markers | ✅ | With proportional horizontal space |
| Drone "d" markers | ✅ | On 5th string, muted colour |
| Rhythm stems | ✅ | Simple stems below tab; beam flag for ≤ 1/8 notes |
| Chord labels | ✅ | Display-only above notes; parsed from quoted ABC symbols |
| Multi-system wrapping | ✅ | Pure-function layout calculator |
| Plain text fallback | ✅ | Copy-to-clipboard supported |
| Print-friendly CSS | ✅ | Hides controls, white background |

## Deferred Elements

| Element | Target Version | Notes |
|---------|---------------|-------|
| Hammer-on / pull-off labels | v0.4+ | "h" / "p" between fret numbers |
| Proper note beams | v0.3+ | Connected beams across adjacent short notes |
| Slide markers | v0.4+ | "/" or "\" between fret numbers |
| Drop-thumb notation | v0.3+ | Right-hand pattern indicators |
| D.C. / D.S. / repeats | v0.4+ | Da Capo, Dal Segno, repeat expansion |
| Double stops / chords | v0.4+ | Simultaneous notes on multiple strings |
| PDF export | v0.3+ | Print-ready PDF generation |
| Professional engraving | Later | LilyPond-quality output |
| Custom string spacing | Later | Per-tuning configuration |
| Capo position display | Later | "Capo 2" label with transposed tab |

## Current Simplifications

### Rhythm Rendering

Rhythm stems are approximate and intended for readable clawhammer tab,
not professional engraving:
- Stem height is based on note duration (longer notes = taller stems)
- A simple beam flag is added for eighth notes (≤ 1/8 duration)
- No connected beams across adjacent notes
- No dotted-note rendering beyond proportional spacing
- No tuplet brackets

### Chord Labels

- Chord symbols in quotes (e.g., `"D"`, `"G"`, `"Em"`) are captured and
  displayed above the relevant note
- Chords are display-only: they do NOT affect the tab arrangement
- Only simple chord symbols are recognised: letter + optional #/b +
  optional m/min/maj/dim/aug/sus + optional digit
- Complex chord names (e.g., `"G/B"`, `"D7sus4"`) may not be captured

### Skipped/Unplayable Notes

- Shown as "x" at the expected string position when string is known
- Defaults to string 3 (middle tab line) when string is unknown
- Original MIDI pitch is preserved in the data model for diagnostics

### Reel Rhythm Display

For 4/4 reel input with L:1/8:
- Notes are displayed with their actual parsed durations
- No implicit doubling or halving of note values
- The visual spacing (24px per 1/8 note) gives readable separation
- A future version may add a "display value" mapping for reels vs
  hornpipes vs jigs

## Future Features

- Hammer-on/pull-off rendering between adjacent fret numbers
- Proper beams connecting groups of short notes
- PDF / print export with page layout
- Drop-thumb notation for clawhammer right-hand patterns
- Manual tab editing (click to change string/fret)
- Tuning-specific string spacing and fret marker dots
