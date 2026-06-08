/** Basic clawhammer drone logic for ClawTrad v0.1.
 *
 *  In basic clawhammer mode, we start from the melody-only path and
 *  add simple 5th-string drone markers only where rhythmically safe.
 *
 *  Current simplifications (documented in MUSIC_ENGINE_NOTES.md):
 *  - Drones added only on strong beats (beat 1 and 3 in 4/4)
 *  - No drop-thumb patterns
 *  - No double-thumbing
 *  - No brush patterns
 *  - No hammer-on / pull-off decorations
 *  - All melody notes remain on strings 1–3
 *  - 5th string is ONLY used as a drone, never melody
 */

import type { TabArrangement } from '../banjo/tabTypes';

/**
 * Add basic 5th-string drone markers to a melody-only arrangement.
 *
 * Logic for v0.1:
 * - In 4/4, mark the 5th string as open (0) on beats 1 and 3 where
 *   there is a melody note already present.
 * - Do NOT add drone notes on their own — only layer them onto
 *   existing melody columns.
 */
export function addBasicClawhammerDrones(
  arrangement: TabArrangement,
): TabArrangement {
  const columns = arrangement.columns.map((col) => {
    if (col.isRest) return col;

    // In 4/4, figure out if this column falls on beat 1 or 3
    // Simple approach: track cumulative duration position
    // We need to compute beat position

    return { ...col }; // no-op for now — return unchanged
  });

  // Compute beat positions and add drones on strong beats
  const meter = '4/4'; // hardcoded for MVP
  const [numBeats, beatUnit] = meter.split('/').map(Number);
  const beatDuration = 1 / beatUnit; // 1/4 note per beat

  let position = 0; // in whole-note units
  let beatIndex = 0;

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    if (col.isRest) {
      position += col.duration;
      continue;
    }

    // Calculate which beat this column starts on
    beatIndex = Math.floor(position / beatDuration) % numBeats;

    // Add drone on strong beats (beat 1 and 3 in 4/4)
    if (beatIndex === 0 || beatIndex === 2) {
      col.hasDrone = true;
      // Mark 5th string as open for drone
      const fifthCell = col.cells.find((c) => c.string === 5);
      if (fifthCell && fifthCell.fret === -1) {
        fifthCell.fret = 0; // open 5th string drone
      }
    }

    position += col.duration;
  }

  arrangement.warnings.push(
    'Basic clawhammer mode: drones added only on strong beats. ' +
    'This is a first-pass arrangement, not a definitive clawhammer tab.',
  );

  return arrangement;
}
