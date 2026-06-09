/** Clawhammer rhythm grid model — ClawTrad v0.2.11.
 *
 *  Meter-aware: reads beatsPerMeasure from the meter string.
 *    M:4/4 → 4 beats, 8 eighth-note slots
 *    M:2/4 → 2 beats, 4 eighth-note slots
 */

import type { TabEvent } from './tabLayoutTypes';

/* ── Types ─────────────────────────────────────────────────── */

export type RhRole = 'M' | 'T' | 'rest' | 'brush';

export interface RhythmSlot {
  beat: number;
  sub: number;
  role: RhRole;
  sounded: boolean;
  isDrone: boolean;
  event: TabEvent | null;
  continuation: boolean;
}

export interface RhythmMeasure { index: number; slots: RhythmSlot[]; }

/* ── Meter helpers ──────────────────────────────────────────── */

/** Parse "4/4" → 4, "2/4" → 2, "6/8" → 6 (treated as 2 dotted quarters for now). */
export function beatsPerMeasure(meter: string): number {
  const m = meter.match(/^(\d+)\/(\d+)/);
  if (!m) return 4;
  const [num, den] = [Number(m[1]), Number(m[2])];
  // For /4 meters: beats = numerator.  For /8: beats = numerator / 3 (compound).
  if (den === 8) return Math.round(num / 3);
  return num;
}

/** Number of L:1/8 slots per measure. */
export function slotsPerMeasure(meter: string): number {
  return beatsPerMeasure(meter) * 2;
}

/* ── Grid builder ──────────────────────────────────────────── */

export function buildRhythmGrid(
  events: TabEvent[],
  measureIndex: number,
  meter: string = '4/4',
): RhythmMeasure {
  const beats = beatsPerMeasure(meter);
  const slots: RhythmSlot[] = [];
  let pos = 0;
  let ei = 0;
  let eventRemaining = 0;

  for (let beat = 0; beat < beats; beat++) {
    for (let sub = 0; sub < 2; sub++) {
      const slotIdx = beat * 2 + sub;

      if (eventRemaining > 0) {
        slots.push({
          beat, sub, role: 'rest', sounded: false,
          isDrone: false, event: null, continuation: true,
        });
        eventRemaining--;
        pos += 0.125;
        continue;
      }

      while (ei < events.length && events[ei].beatPosition <= pos + 0.001) {
        const evt = events[ei];
        const durSlots = Math.round(evt.duration / 0.125);
        ei++;
        if (durSlots <= 0) continue;
        slots.push({
          beat, sub,
          role: roleForEvent(evt),
          sounded: evt.kind !== 'rest',
          isDrone: evt.kind === 'drone',
          event: evt, continuation: false,
        });
        eventRemaining = durSlots - 1;
        pos += 0.125;
        break;
      }

      if (slots.length <= slotIdx) {
        slots.push({
          beat, sub, role: 'rest', sounded: false,
          isDrone: false, event: null, continuation: false,
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

export interface BeamGroup { beat: number; slots: number[]; }

export function computeBeamGroups(slots: RhythmSlot[]): BeamGroup[] {
  const groups: BeamGroup[] = [];
  const beats = Math.floor(slots.length / 2);

  for (let beat = 0; beat < beats; beat++) {
    const down = beat * 2;
    const off = beat * 2 + 1;
    const d = slots[down];
    const o = slots[off];
    if (d && o && d.sounded && o.sounded && !d.isDrone && !o.isDrone) {
      groups.push({ beat, slots: [down, off] });
    }
  }

  return groups;
}
