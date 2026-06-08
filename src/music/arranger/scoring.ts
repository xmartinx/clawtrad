/** Position scoring for melody-to-tab arrangement.
 *
 *  Scores candidate (string, fret) positions for a note against the
 *  priorities listed in MUSIC_ENGINE_NOTES.md:
 *    1. Prefer lower frets
 *    2. Prefer open strings where musically useful
 *    3. Avoid large jumps from previous position
 *    4. Prefer strings 1–3 for melody
 *    5. Avoid using the 5th string as normal melody
 *    6. Prefer positions that allow simple clawhammer right-hand flow
 */

import type { FretPosition } from '../banjo/fretboard';

/** Scoring weights (all positive; higher = better). */
const WEIGHTS = {
  /** Bonus per fret below MAX_FRET (so lower frets score higher). */
  lowFret: 3,
  /** Bonus for open strings (fret 0). */
  openString: 4,
  /** Bonus for playing on melody strings (1–3). */
  melodyString: 5,
  /** Penalty for using 5th string as melody. */
  fifthStringPenalty: -20,
  /** Penalty per fret of jump from previous position. */
  jumpPenaltyPerFret: -2,
  /** Penalty per string of jump from previous position. */
  jumpPenaltyPerString: -1,
  /** Bonus for staying on same string. */
  sameString: 2,
} as const;

/**
 * Score a single candidate position for a note.
 * `prev` can be null for the first note in the sequence.
 */
export function scorePosition(
  pos: FretPosition,
  prev: FretPosition | null,
): number {
  let score = 0;

  // Prefer lower frets
  score += (7 - pos.fret) * WEIGHTS.lowFret;

  // Bonus for open strings
  if (pos.fret === 0) {
    score += WEIGHTS.openString;
  }

  // Prefer melody strings (1–3)
  if (pos.string >= 1 && pos.string <= 3) {
    score += WEIGHTS.melodyString;
  }

  // Penalty for using 5th string as melody
  if (pos.string === 5) {
    score += WEIGHTS.fifthStringPenalty;
  }

  // Avoid large jumps from previous position
  if (prev) {
    const fretJump = Math.abs(pos.fret - prev.fret);
    const stringJump = Math.abs(pos.string - prev.string);

    score += fretJump * WEIGHTS.jumpPenaltyPerFret;
    score += stringJump * WEIGHTS.jumpPenaltyPerString;

    // Bonus for staying on same string
    if (pos.string === prev.string) {
      score += WEIGHTS.sameString;
    }
  }

  return score;
}

/**
 * Select the best position from a list of candidates, given the
 * previous position (or null for the first note).
 *
 * If no candidates are available (shouldn't happen with valid input),
 * returns null.
 */
export function selectBestPosition(
  candidates: FretPosition[],
  prev: FretPosition | null,
): FretPosition | null {
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestScore = scorePosition(best, prev);

  for (let i = 1; i < candidates.length; i++) {
    const score = scorePosition(candidates[i], prev);
    if (score > bestScore) {
      bestScore = score;
      best = candidates[i];
    }
  }

  return best;
}
