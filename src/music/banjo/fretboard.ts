/** Fretboard mapping for 5-string banjo — ClawTrad v0.2.4.
 *
 *  Given a tuning and a target MIDI pitch, this module finds all
 *  (string, fret) positions that can produce that pitch.
 *
 *  v0.2.4 fret policy:
 *  - Strings 1–2: frets 0–10 (melody)
 *  - Strings 3–4: frets 0–7  (melody)
 *  - String 5:     fret 0 only, drone-only (never melody)
 */

import type { Tuning } from './tunings';

/** A position on the banjo fretboard. */
export interface FretPosition {
  /** String number (1–5, where 1 is closest to floor). */
  string: number;
  /** Fret number (0 = open). */
  fret: number;
  /** MIDI pitch produced at this position. */
  pitch: number;
  /** Original MIDI pitch before octave shift (if shifted). */
  originalPitch?: number;
}

/** Maximum frets per string group. */
const MAX_FRET_MELODY_HIGH = 10;  // strings 1–2
const MAX_FRET_MELODY_LOW = 7;    // strings 3–4

/**
 * Find all valid MELODY (string, fret) positions for a given pitch.
 * Excludes the 5th string — it is drone-only.
 * Returns positions sorted by fret (lowest first), then by string.
 */
export function findPositions(pitch: number, tuning: Tuning): FretPosition[] {
  const positions: FretPosition[] = [];

  for (let strIdx = 0; strIdx < 4; strIdx++) {
    // only strings 1–4 (indices 0–3) for melody
    const openPitch = tuning.openPitches[strIdx];
    const fret = pitch - openPitch;
    const maxFret = strIdx <= 1 ? MAX_FRET_MELODY_HIGH : MAX_FRET_MELODY_LOW;

    if (fret >= 0 && fret <= maxFret) {
      positions.push({
        string: strIdx + 1,
        fret,
        pitch,
      });
    }
  }

  positions.sort((a, b) => {
    if (a.fret !== b.fret) return a.fret - b.fret;
    return a.string - b.string;
  });

  return positions;
}

/**
 * Find the 5th-string drone position (open only, fret 0).
 * Returns null if the 5th string's open pitch doesn't match.
 */
export function findDronePosition(pitch: number, tuning: Tuning): FretPosition | null {
  const open5 = tuning.openPitches[4]; // index 4 = string 5
  if (pitch === open5) {
    return { string: 5, fret: 0, pitch };
  }
  return null;
}

/**
 * Return the open-string MIDI pitch for a given string in a tuning.
 */
export function openPitch(string: number, tuning: Tuning): number {
  return tuning.openPitches[string - 1];
}

/**
 * Return the maximum fret allowed for a given string.
 */
export function maxFretForString(string: number): number {
  if (string === 5) return 0;
  if (string <= 2) return MAX_FRET_MELODY_HIGH;
  return MAX_FRET_MELODY_LOW;
}
