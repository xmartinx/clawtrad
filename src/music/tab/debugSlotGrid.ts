/** Debug slot-grid representation — ClawTrad v0.2.8.
 *
 *  Produces a deterministic, testable representation of each 4/4
 *  measure's 8 eighth-note slots, driven from the same data the
 *  renderer uses (TabDocument + arrangement).
 *
 *  This is NOT shown in the normal UI.  It exists for debugging
 *  and for exact slot-content assertions in tests.
 */

import type { TabDocument, TabEvent } from './tabLayoutTypes';

/* ── Types ─────────────────────────────────────────────────── */

export interface DebugSlot {
  /** Slot index 0–7 within the measure. */
  index: number;
  /** Beat index 0–3. */
  beatIndex: number;
  /** "downbeat" (sub=0) or "offbeat" (sub=1). */
  positionInBeat: 'downbeat' | 'offbeat';
  /** Kind of event in this slot. */
  eventKind: 'melody' | 'drone' | 'rest' | 'continuation' | 'empty';
  /** Human-readable pitch name, if available. */
  pitchName?: string;
  /** String index 0–4, if applicable. */
  stringIndex?: number;
  /** Fret number, if applicable. */
  fret?: number;
  /** Right-hand role, if assigned. */
  rightHandRole?: 'M' | 'T' | 'H' | 'P' | 'Sl' | 'rest';
  /** Source event duration, if available. */
  sourceDuration?: number;
}

export interface DebugMeasureGrid {
  measureIndex: number;
  meter: string;
  slotCount: 8;
  slots: DebugSlot[];
}

/* ── Builder ───────────────────────────────────────────────── */

/** Build a debug slot grid from a TabDocument's measure. */
export function buildDebugSlotGrid(
  doc: TabDocument,
  measureIndex: number,
): DebugMeasureGrid {
  const measure = doc.measures[measureIndex];
  if (!measure) {
    return { measureIndex, meter: doc.meter, slotCount: 8, slots: [] };
  }

  const events = measure.events;
  const slots: DebugSlot[] = [];

  // Walk all events and assign them to slots by beatPosition
  let ei = 0;
  let pos = 0;

  for (let beat = 0; beat < 4; beat++) {
    for (let sub = 0; sub < 2; sub++) {
      const slotIdx = beat * 2 + sub;

      // Find events that start at this position
      const slotEvents = findEventsAt(events, ei, pos);

      if (slotEvents.length > 0) {
        for (const evt of slotEvents) {
          slots.push(eventToDebugSlot(evt, slotIdx, beat, sub));
          ei++;
        }
      } else {
        slots.push({
          index: slotIdx,
          beatIndex: beat,
          positionInBeat: sub === 0 ? 'downbeat' : 'offbeat',
          eventKind: 'empty',
        });
      }

      pos += 0.125;
    }
  }

  return { measureIndex, meter: doc.meter, slotCount: 8, slots };
}

function findEventsAt(
  events: TabEvent[],
  startIdx: number,
  pos: number,
): TabEvent[] {
  const result: TabEvent[] = [];
  for (let i = startIdx; i < events.length; i++) {
    if (Math.abs(events[i].beatPosition - pos) < 0.001) {
      result.push(events[i]);
    } else if (events[i].beatPosition > pos + 0.001) {
      break;
    }
  }
  return result;
}

function eventToDebugSlot(
  evt: TabEvent,
  slotIdx: number,
  beat: number,
  sub: number,
): DebugSlot {
  const slot: DebugSlot = {
    index: slotIdx,
    beatIndex: beat,
    positionInBeat: sub === 0 ? 'downbeat' : 'offbeat',
    eventKind: eventKindFor(evt),
    stringIndex: evt.stringIndex,
    fret: evt.fret,
    sourceDuration: evt.duration,
  };

  if (evt.kind === 'drone') {
    slot.rightHandRole = 'T';
  } else if (evt.kind === 'note') {
    slot.rightHandRole = 'M';
  } else if (evt.kind === 'rest') {
    slot.rightHandRole = 'rest';
  }

  return slot;
}

function eventKindFor(evt: TabEvent): DebugSlot['eventKind'] {
  switch (evt.kind) {
    case 'note': return 'melody';
    case 'drone': return 'drone';
    case 'rest': return 'rest';
    default: return 'empty';
  }
}

/* ── Helpers for test assertions ───────────────────────────── */

/** Assert that exactly N melody events exist in a measure. */
export function countMelodyEvents(doc: TabDocument, mi: number): number {
  return doc.measures[mi].events.filter((e) => e.kind === 'note').length;
}

/** Assert that exactly N drone events exist in a measure. */
export function countDroneEvents(doc: TabDocument, mi: number): number {
  return doc.measures[mi].events.filter((e) => e.kind === 'drone').length;
}

/** Get drone slot indices within a measure's tab events. */
export function droneSlotIndices(doc: TabDocument, mi: number): number[] {
  const indices: number[] = [];
  let slot = 0;
  for (const evt of doc.measures[mi].events) {
    if (evt.kind === 'drone') indices.push(slot);
    slot += Math.round(evt.duration / 0.125);
  }
  return indices;
}
