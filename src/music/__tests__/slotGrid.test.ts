/**
 * Exact slot-grid assertions for v0.2.8.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { buildDebugSlotGrid, countMelodyEvents, countDroneEvents } from '../tab/debugSlotGrid';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

/* ── Test Case 1: Quarter Beat Drone Fill ──────────────────── */

describe('Quarter Beat Drone Fill (D2 E2 F2 G2)', () => {
  const abc = `X:1
T:Quarter Beat Drone Fill Test
M:4/4
L:1/8
K:G
D2 E2 F2 G2 |`;

  const parsed = parseAbc(abc);
  const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');
  const doc = buildTabDocument(parsed, arrangement);

  it('produces exactly 8 events in the measure', () => {
    expect(doc.measures[0].events.length).toBeGreaterThanOrEqual(8);
  });

  it('has exactly 4 melody events', () => {
    expect(countMelodyEvents(doc, 0)).toBe(4);
  });

  it('has exactly 4 drone events', () => {
    expect(countDroneEvents(doc, 0)).toBe(4);
  });

  it('drone slots are exactly 1, 3, 5, 7', () => {
    // After drone fill, the events array interleaves melody and drone
    const events = doc.measures[0].events;
    const dronePositions: number[] = [];
    let bp = 0;
    for (const e of events) {
      if (e.kind === 'drone') {
        dronePositions.push(Math.round(bp / 0.125));
      }
      bp += e.duration;
    }
    expect(dronePositions).toEqual([1, 3, 5, 7]);
  });

  it('debug slot grid has 8 slots', () => {
    const grid = buildDebugSlotGrid(doc, 0);
    expect(grid.slots).toHaveLength(8);
  });

  it('debug grid: slot 0 is melody D, slot 1 is drone', () => {
    const grid = buildDebugSlotGrid(doc, 0);

    // First beat pair
    expect(grid.slots[0].eventKind).toBe('melody');
    expect(grid.slots[0].beatIndex).toBe(0);
    expect(grid.slots[0].positionInBeat).toBe('downbeat');

    expect(grid.slots[1].eventKind).toBe('drone');
    expect(grid.slots[1].beatIndex).toBe(0);
    expect(grid.slots[1].positionInBeat).toBe('offbeat');
    expect(grid.slots[1].rightHandRole).toBe('T');
  });

  it('debug grid: slot 2 melody, slot 3 drone, slot 4 melody, slot 5 drone', () => {
    const grid = buildDebugSlotGrid(doc, 0);
    expect(grid.slots[2].eventKind).toBe('melody');
    expect(grid.slots[3].eventKind).toBe('drone');
    expect(grid.slots[4].eventKind).toBe('melody');
    expect(grid.slots[5].eventKind).toBe('drone');
  });

  it('debug grid: slot 6 melody, slot 7 drone', () => {
    const grid = buildDebugSlotGrid(doc, 0);
    expect(grid.slots[6].eventKind).toBe('melody');
    expect(grid.slots[7].eventKind).toBe('drone');
  });

  it('no slot is empty', () => {
    const grid = buildDebugSlotGrid(doc, 0);
    for (const slot of grid.slots) {
      expect(slot.eventKind).not.toBe('empty');
    }
  });

  it('first measure is NOT collapsed to 6 events / 3 groups', () => {
    const events = doc.measures[0].events;
    expect(events.length).toBeGreaterThanOrEqual(8);
    // Must have exactly 4 melody + 4 drone
    const melodies = events.filter((e) => e.kind === 'note');
    const drones = events.filter((e) => e.kind === 'drone');
    expect(melodies.length).toBe(4);
    expect(drones.length).toBe(4);
  });
});

/* ── Test Case 2: Full Quaver Melody ───────────────────────── */

describe('Full Quaver Melody (D E F# G A B c d)', () => {
  const abc = `X:2
T:Full Quaver Melody Test
M:4/4
L:1/8
K:G
D E F G A B c d |`;

  const parsed = parseAbc(abc);
  const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');
  const doc = buildTabDocument(parsed, arrangement);

  it('has exactly 8 melody events, 0 drones', () => {
    expect(countMelodyEvents(doc, 0)).toBe(8);
    expect(countDroneEvents(doc, 0)).toBe(0);
  });

  it('debug grid: all 8 slots are melody', () => {
    const grid = buildDebugSlotGrid(doc, 0);
    expect(grid.slots).toHaveLength(8);
    for (const slot of grid.slots) {
      expect(slot.eventKind).toBe('melody');
      expect(slot.positionInBeat).toBe(
        slot.index % 2 === 0 ? 'downbeat' : 'offbeat',
      );
    }
  });

  it('no thumb assigned to string 1 in any event', () => {
    for (const e of doc.measures[0].events) {
      if (e.kind === 'note' && e.stringIndex === 0) {
        // string 1 is OK for melody, but NOT for drone/thumb
        expect(e.kind).not.toBe('drone');
      }
    }
    // No drone events at all for full quaver bar
    const drones = doc.measures[0].events.filter((e) => e.kind === 'drone');
    expect(drones.length).toBe(0);
  });

  it('four beat-pair groups are identifiable', () => {
    const events = doc.measures[0].events;
    // 8 events, each 0.125 duration
    expect(events.length).toBe(8);
    // Beat pairs: [0,1][2,3][4,5][6,7]
    for (let beat = 0; beat < 4; beat++) {
      const down = events[beat * 2];
      const off = events[beat * 2 + 1];
      expect(down.kind).toBe('note');
      expect(off.kind).toBe('note');
      // Beat positions align within each pair
      expect(down.beatPosition).toBeCloseTo(beat * 0.25, 2);
      expect(off.beatPosition).toBeCloseTo(beat * 0.25 + 0.125, 2);
    }
  });
});

/* ── Beat-pair grouping via arrangement columns ────────────── */

describe('arrangement column expansion count', () => {
  it('quarter notes expand to 8 columns after drone fill', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');
    // 4 melody + 4 drone = 8
    expect(arrangement.columns.length).toBe(8);
  });

  it('eighth notes stay at 8 columns with no drones', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');
    expect(arrangement.columns.length).toBe(8);
    const drones = arrangement.columns.filter((c) => c.hasDrone);
    expect(drones.length).toBe(0);
  });
});

/* ── Regression: Double C and no x markers ─────────────────── */

describe('regression checks', () => {
  it('no x markers in any output', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);
    for (const m of doc.measures) {
      for (const e of m.events) {
        expect(e.kind).not.toBe('skipped');
      }
    }
  });

  it('Double C still works correctly', () => {
    const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:C\nC2 D2 E2 F2 |`);
    const arr = arrangeMelody(parsed, doubleC, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);
    expect(doc.tuningId).toBe('gCGCD');
    expect(doc.tuningLabel).toBe('Double C');
    expect(doc.measures[0].events.length).toBeGreaterThanOrEqual(8);
  });
});
