/** Fretboard mapping for 5-string banjo.
 *
 *  Given a tuning and a target MIDI pitch, this module finds all
 *  (string, fret) positions that can produce that pitch within the
 *  allowed fret range (0–7 for the MVP).
 */

import type { Tuning } from './tunings';

/** A position on the banjo fretboard. */
export interface FretPosition {
  /** String number (1–5, where 1 is closest to floor). */
  string: number;
  /** Fret number (0 = open, 1–7 for MVP). */
  fret: number;
  /** MIDI pitch produced at this position. */
  pitch: number;
}

/** Maximum fret considered in v0.1. */
export const MAX_FRET = 7;

/**
 * Find all valid (string, fret) positions for a given pitch in a tuning.
 * Returns positions sorted by fret (lowest first), then by string (1–5).
 */
export function findPositions(pitch: number, tuning: Tuning): FretPosition[] {
  const positions: FretPosition[] = [];

  for (let strIdx = 0; strIdx < tuning.openPitches.length; strIdx++) {
    const openPitch = tuning.openPitches[strIdx];
    const fret = pitch - openPitch;

    if (fret >= 0 && fret <= MAX_FRET) {
      positions.push({
        string: strIdx + 1, // 1-indexed
        fret,
        pitch,
      });
    }
  }

  // Sort: lower frets first, then lower string numbers
  positions.sort((a, b) => {
    if (a.fret !== b.fret) return a.fret - b.fret;
    return a.string - b.string;
  });

  return positions;
}

/**
 * Return the open-string MIDI pitch for a given string in a tuning.
 */
export function openPitch(string: number, tuning: Tuning): number {
  return tuning.openPitches[string - 1];
}
