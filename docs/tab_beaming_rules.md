# Tab Beaming Rules — ClawTrad v0.2.5

Beams and stems are **rhythmic notation**, not decoration. They communicate
the subdivision of the beat to the player.

## 4/4 Reel Beaming

A 4/4 reel is treated as **eight quaver/eighth-note slots per bar**:

```
1 & 2 & 3 & 4 &
```

Each beat (1, 2, 3, 4) contains two subdivisions: the downbeat and the
offbeat ("&").

## Beaming Rules

1. **Beam by beat**: Pair the two quavers within each beat: [1 &] [2 &] [3 &] [4 &].
2. **No beams across barlines**: Beams never cross a barline.
3. **No beams through rests**: If either slot in a beat-pair is a rest,
   the pair is not beamed.
4. **Long notes are not beamed**: Quarter notes (crotchets) and longer
   durations have a single stem, no beam.
5. **Drone notes are not beamed**: 5th-string drone events are not
   beamed (they are thumb-struck independently).

## Duration Display

| ABC Duration | Display Category | Visual Treatment |
|-------------|-----------------|------------------|
| 1/8 (0.125) | Eighth / quaver | Stem + beamed in pairs |
| 1/4 (0.25)  | Quarter / crotchet | Stem, no beam |
| 1/2 (0.5)   | Half / minim | Taller stem, no beam |

## Simplified / Omitted Notes

When the engine omits or simplifies a melody note:

- **Missing second quaver in a beat**: Lengthen the previous note to a
  quarter note (so the player holds it for the full beat).
- **Missing first quaver in a beat**: Insert a rest in the first slot
  and keep the second quaver as an eighth note.
- **Never use x for a skipped/missed note in normal tab output.**

## Implementation

The beaming logic lives in:
- `src/music/tab/clawhammerRhythmGrid.ts` — rhythm grid decomposition
- `src/music/tab/tabBeaming.ts` — beaming plan for measures
- `src/components/VisualTab.tsx` — SVG rendering of beams

The rhythm grid model supports future drop-thumb, brush, and technique
rendering by providing a per-slot right-hand role field and sounding flag.

## Future

- Proper connected beams for sixteenth-note groupings (jigs, reels with
  ornamentation)
- Tuplet brackets
- Dotted-note rendering
