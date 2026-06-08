/** Clawhammer rhythm grid model — ClawTrad v0.2.6.
 *
 *  Represents a 4/4 reel as 8 eighth-note slots per measure:
 *    1 & 2 & 3 & 4 &
 *
 *  v0.2.6: Events spanning multiple slots (e.g. quarter notes)
 *  are correctly expanded.  The grid always produces exactly 8
 *  slots per 4/4 measure regardless of input event count.
 */

import type { TabEvent } from './tabLayoutTypes';

/* ── Types ─────────────────────────────────────────────────── */

export type RhRole = 'M' | 'T' | 'rest' | 'brush';

export interface RhythmSlot {
  beat: number;
  sub: number;  // 0 = downbeat, 1 = offbeat
  role: RhRole;
  sounded: boolean;
  isDrone: boolean;
  /** The source event for the FIRST slot it occupies; null for empty. */
  event: TabEvent | null;
  /** True when this slot continues a multi-slot event from a previous slot. */
  continuation: boolean;
}

export interface RhythmMeasure {
  index: number;
  slots: RhythmSlot[];
}

/* ── Grid builder ──────────────────────────────────────────── */

/**
 * Decompose a measure's events into exactly 8 eighth-note rhythm
 * slots (4 beats × 2 subdivisions).
 *
 * Events with duration > 0.125 span multiple slots.  The first
 * slot carries the event; continuation slots are marked empty
 * (fillable by thumb/drone in clawhammer mode).
 */
export function buildRhythmGrid(
  events: TabEvent[],
  measureIndex: number,
): RhythmMeasure {
  const slots: RhythmSlot[] = [];
  let pos = 0;     // cumulative beat position within measure
  let ei = 0;       // event index
  let eventRemaining = 0; // remaining slots for current event

  for (let beat = 0; beat < 4; beat++) {
    for (let sub = 0; sub < 2; sub++) {
      const slotIdx = beat * 2 + sub;

      if (eventRemaining > 0) {
        // Continuing a multi-slot event — create continuation slot
        slots.push({
          beat, sub,
          role: 'rest',        // placeholder, fillable by drone
          sounded: false,
          isDrone: false,
          event: null,
          continuation: true,
        });
        eventRemaining--;
        pos += 0.125;
        continue;
      }

      // Advance to the next event that starts at or before current position
      while (ei < events.length && events[ei].beatPosition <= pos + 0.001) {
        const evt = events[ei];
        const durSlots = Math.round(evt.duration / 0.125);
        ei++;

        if (durSlots <= 0) continue;

        const role = roleForEvent(evt);
        slots.push({
          beat, sub,
          role,
          sounded: evt.kind !== 'rest',
          isDrone: evt.kind === 'drone',
          event: evt,
          continuation: false,
        });

        eventRemaining = durSlots - 1;
        pos += 0.125;
        // break out of while — next slot iteration handles continuations
        break;
      }

      // If we didn't find an event at this position, create empty slot
      if (slots.length <= slotIdx) {
        slots.push({
          beat, sub,
          role: 'rest',
          sounded: false,
          isDrone: false,
          event: null,
          continuation: false,
        });
        pos += 0.125;
      }
    }
  }

  return { index: measureIndex, slots };
}

function roleForEvent(evt: TabEvent): RhRole {
  if (evt.kind === 'rest') return 'rest';
  if (evt.kind === 'drone') return 'T';
  return 'M';
}

/* ── Beaming helpers ───────────────────────────────────────── */

export interface BeamGroup {
  beat: number;
  slots: number[];
}

/**
 * Compute beam groups for a measure.
 *
 * Rules:
 *  - Beat groups: [1&amp;] [2&amp;] [3&amp;] [4&amp;]
 *  - Only beam if both slots in a beat are sounded.
 *  - No beams through rests.
 *  - No beams across barlines.
 *  - No drone-only beams.
 */
export function computeBeamGroups(slots: RhythmSlot[]): BeamGroup[] {
  const groups: BeamGroup[] = [];

  for (let beat = 0; beat < 4; beat++) {
    const down = beat * 2;
    const off = beat * 2 + 1;
    const d = slots[down];
    const o = slots[off];

    if (
      d && o &&
      d.sounded && o.sounded &&
      !d.isDrone && !o.isDrone
    ) {
      groups.push({ beat, slots: [down, off] });
    }
  }

  return groups;
}
