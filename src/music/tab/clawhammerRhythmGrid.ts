/** Clawhammer rhythm grid model — ClawTrad v0.2.5.
 *
 *  Represents a 4/4 reel as a grid of beat subdivisions:
 *    1 & 2 & 3 & 4 &
 *
 *  Each slot can carry a right-hand role (M, T, rest, brush),
 *  a fret (or drone marker), and display/beaming metadata.
 *
 *  This model is the foundation for future drop-thumb, brush,
 *  and technique rendering.  For v0.2.5 it provides beaming
 *  information for 4/4 reel-style tab.
 */

import type { TabEvent } from './tabLayoutTypes';

/* ── Types ─────────────────────────────────────────────────── */

/** Right-hand role for a rhythm slot. */
export type RhRole = 'M' | 'T' | 'rest' | 'brush';

/** A single slot in the rhythm grid. */
export interface RhythmSlot {
  /** Beat index (0-based within measure). */
  beat: number;
  /** Subdivision: 0 = downbeat (&quot;1&quot;), 1 = offbeat (&quot;&amp;&quot;). */
  sub: number;
  /** Right-hand role. */
  role: RhRole;
  /** Whether this slot is sounded (vs. ghost/miss). */
  sounded: boolean;
  /** Whether this is a 5th-string drone. */
  isDrone: boolean;
  /** The tab event this slot represents, if any. */
  event: TabEvent | null;
}

/** A measure decomposed into rhythm slots. */
export interface RhythmMeasure {
  index: number;
  slots: RhythmSlot[];
}

/* ── Grid builder ──────────────────────────────────────────── */

/**
 * Decompose a measure's events into a 4/4 rhythm grid.
 *
 * Each beat is split into two subdivisions: downbeat (0) and
 * offbeat (1).  Events are mapped to slots by accumulating
 * beat position.
 *
 * For 4/4 with 8 eighth-notes per measure, each slot is 0.125
 * (1/8 note) wide.
 */
export function buildRhythmGrid(
  events: TabEvent[],
  measureIndex: number,
): RhythmMeasure {
  const slots: RhythmSlot[] = [];
  let pos = 0;
  let ei = 0;

  for (let beat = 0; beat < 4; beat++) {
    for (let sub = 0; sub < 2; sub++) {
      const slotDuration = 0.125; // 1/8 note per slot

      if (ei < events.length && events[ei].beatPosition <= pos + 0.001) {
        const evt = events[ei];
        const role = roleForEvent(evt);
        slots.push({
          beat,
          sub,
          role,
          sounded: evt.kind !== 'rest',
          isDrone: evt.kind === 'drone',
          event: evt,
        });
        ei++;
      } else {
        // Empty slot — rest
        slots.push({
          beat,
          sub,
          role: 'rest',
          sounded: false,
          isDrone: false,
          event: null,
        });
      }

      pos += slotDuration;
    }
  }

  return { index: measureIndex, slots };
}

function roleForEvent(evt: TabEvent): RhRole {
  if (evt.kind === 'rest') return 'rest';
  if (evt.kind === 'drone') return 'T';  // thumb plays drone
  return 'M';  // melody note = frail
}

/* ── Beaming helpers ───────────────────────────────────────── */

/** Beam group: indices of slots that form a beamed pair. */
export interface BeamGroup {
  beat: number;
  slots: number[]; // indices into the slots array (2 per beam: [downbeat, offbeat])
}

/**
 * Compute beam groups for a measure's rhythm slots.
 *
 * Rules:
 *  - Group every two quavers by beat: [1&amp;] [2&amp;] [3&amp;] [4&amp;]
 *  - No beams across barlines.
 *  - No beams through rests.
 *  - A beat-group only beams if both slots are sounded.
 */
export function computeBeamGroups(slots: RhythmSlot[]): BeamGroup[] {
  const groups: BeamGroup[] = [];

  for (let beat = 0; beat < 4; beat++) {
    const down = beat * 2;
    const off = beat * 2 + 1;
    const downSlot = slots[down];
    const offSlot = slots[off];

    if (
      downSlot && offSlot &&
      downSlot.sounded && offSlot.sounded &&
      !downSlot.isDrone && !offSlot.isDrone
    ) {
      groups.push({ beat, slots: [down, off] });
    }
  }

  return groups;
}
