/** Clawhammer drone and fingering logic — ClawTrad v0.2.7.
 *
 *  v0.2.7: Offbeat-only drone fill.
 *  - Quarter-note melody beats get an open 5th-string drone in the
 *    empty offbeat slot: [melody 0] [melody 0] ...
 *  - Full eighth-note bars get ZERO drones because every slot is
 *    occupied by melody.
 *  - Drones are string 5, fret 0 only.
 *  - Beat count is preserved exactly: 8 eighth slots per 4/4 bar.
 *
 *  Fingering rules (for future drop-thumb / technique rendering):
 *  - First slot of a beat pair: frailing finger (melody).
 *  - Second slot: thumb drone (if empty), or drop-thumb (if reachable
 *    melody), or same-string H/P/Sl candidate.
 *  - Thumb never plays string 1.
 *  - Thumb never plays fretted 5th string.
 */

import type { TabArrangement, TabColumn, TabCell } from '../banjo/tabTypes';

/**
 * Add clawhammer fill to a melody arrangement.
 *
 * For each melody column:
 *  - If duration is 0.25 (quarter note): insert an open 5th-string
 *    drone column in the offbeat slot immediately after.
 *  - If duration is 0.125 (eighth note): leave as-is (slot occupied).
 *  - Longer notes: fill every empty offbeat within their span.
 *
 * Returns a NEW TabArrangement (does not mutate input).
 */
export function addBasicClawhammerDrones(
  arrangement: TabArrangement,
): TabArrangement {
  const src = arrangement.columns;
  const expanded: TabColumn[] = [];
  let pos = 0; // cumulative eighth-slot index (0–7 per measure)

  for (const col of src) {
    if (col.isRest) {
      expanded.push(col);
      pos += Math.round(col.duration / 0.125);
      continue;
    }

    const slots = Math.round(col.duration / 0.125);
    // The melody occupies the first slot of its span.
    expanded.push({ ...col, duration: 0.125, hasDrone: false });

    // Fill remaining slots (offbeats) with open 5th-string drones
    for (let s = 1; s < slots; s++) {
      expanded.push(makeDroneColumn());
    }

    pos += slots;
  }

  arrangement.warnings.push(
    'In Basic Clawhammer mode, open 5th-string drones are added on ' +
    'offbeat thumb positions where space allows. ' +
    'This is a first-pass arrangement, not a definitive clawhammer tab.',
  );

  return {
    ...arrangement,
    columns: expanded,
  };
}

function makeDroneColumn(): TabColumn {
  const cells: TabCell[] = [];
  for (let s = 1; s <= 5; s++) {
    cells.push({ string: s, fret: s === 5 ? 0 : -1 });
  }
  return { cells, duration: 0.125, hasDrone: true, isRest: false };
}

/* ── Clawhammer pair fingering ─────────────────────────────── */

/**
 * Determine the right-hand role for a slot in a beat pair.
 *
 * Rules:
 *  - First slot (sub=0): always melody / frailing finger.
 *  - Second slot (sub=1):
 *    - If empty → open 5th-string thumb drone.
 *    - If occupied by melody → check drop-thumb reach.
 *    - If not reachable → mark as same-string H/P/Sl candidate.
 */

export type PairRole = 'M' | 'T-drone' | 'T-drop' | 'H' | 'P' | 'Sl' | 'rest';

export interface PairSlot {
  role: PairRole;
  stringIndex?: number;
  fret?: number;
}

/**
 * Assign clawhammer fingering roles to a beat pair.
 *
 * @param prev  The frailing position (first slot melody note).
 *              Null if first slot is empty/rest.
 * @param next  The target position for the second slot.
 *              Null if second slot is empty (→ drone).
 */
export function assignPairRoles(
  prev: { string: number; fret: number } | null,
  next: { string: number; fret: number } | null,
): [PairSlot, PairSlot] {
  const first: PairSlot = prev
    ? { role: 'M', stringIndex: prev.string - 1, fret: prev.fret }
    : { role: 'rest' };

  let second: PairSlot;

  if (!next) {
    // Empty offbeat — fill with drone
    second = { role: 'T-drone', stringIndex: 4, fret: 0 };
  } else if (!prev) {
    // No previous note — melody, not thumb
    second = { role: 'M', stringIndex: next.string - 1, fret: next.fret };
  } else if (next.string === prev.string) {
    // Same string — H, P, or Sl candidate
    const diff = next.fret - prev.fret;
    if (diff >= 1 && diff <= 3) {
      second = { role: diff <= 2 ? 'H' : 'Sl', stringIndex: next.string - 1, fret: next.fret };
    } else if (diff < 0 && diff >= -3) {
      second = { role: 'P', stringIndex: next.string - 1, fret: next.fret };
    } else {
      second = { role: 'M', stringIndex: next.string - 1, fret: next.fret };
    }
  } else if (canDropThumb(prev, next)) {
    // Reachable drop-thumb
    second = { role: 'T-drop', stringIndex: next.string - 1, fret: next.fret };
  } else {
    // Not reachable by thumb — treat as melody
    second = { role: 'M', stringIndex: next.string - 1, fret: next.fret };
  }

  return [first, second];
}

/**
 * Conservative drop-thumb reach rule (v0.2.7):
 *  - Thumb may drop to string N+1 only (adjacent inner string).
 *  - Never string 1.
 *  - Never string 5 (except open drone, handled separately).
 */
export function canDropThumb(
  prev: { string: number; fret: number },
  next: { string: number; fret: number },
): boolean {
  // Thumb never plays string 1
  if (next.string === 1) return false;
  // Thumb never plays string 5 (drone-only)
  if (next.string === 5) return false;
  // Only adjacent N+1 drop
  return next.string === prev.string + 1;
}

/** Check if a melody note should trigger a 5th-string drone fill. */
export function shouldFillDrone(
  noteDuration: number,
  hasFollowingNote: boolean,
): boolean {
  // Fill drone when a quarter note has an empty offbeat after it
  return noteDuration >= 0.25 && hasFollowingNote === false;
}
