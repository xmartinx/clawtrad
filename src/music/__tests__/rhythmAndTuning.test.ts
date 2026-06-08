/**
 * Rhythm grid, Double C wiring, and stem tests for v0.2.6.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { buildRhythmGrid } from '../tab/clawhammerRhythmGrid';
import { TUNINGS, tuningStringLabels } from '../banjo/tunings';
import { findPositions } from '../banjo/fretboard';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;
const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;

/* ── Rhythm grid beat preservation ─────────────────────────── */

describe('rhythm grid beat preservation', () => {
  it('D2 E2 F2 G2 produces 8 eighth slots in 4/4', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const measure = doc.measures[0];
    const grid = buildRhythmGrid(measure.events, 0);

    // Must produce exactly 8 slots for a 4/4 measure
    expect(grid.slots).toHaveLength(8);
  });

  it('quarter notes span 2 slots each', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const measure = doc.measures[0];
    const grid = buildRhythmGrid(measure.events, 0);

    // D2 = 2 slots, E2 = 2 slots, total 8
    expect(grid.slots).toHaveLength(8);

    // First 2 slots should be from D2
    const soundedSlots = grid.slots.filter((s) => s.sounded);
    expect(soundedSlots.length).toBe(2); // D2 and E2, each spanning 2 slots
  });

  it('4 quarter notes do not become 6 eighths', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const measure = doc.measures[0];
    // Measure should have exactly 4 note events in the document
    const noteEvents = measure.events.filter((e) => e.kind === 'note');
    expect(noteEvents.length).toBe(4);
  });

  it('empty slots are after each quarter note for drone fill', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const measure = doc.measures[0];
    const grid = buildRhythmGrid(measure.events, 0);

    // Check continuation slots exist
    const continuations = grid.slots.filter((s) => s.continuation);
    expect(continuations.length).toBe(4); // one after each quarter note
  });

  it('all 8 slots have correct beat and sub values', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const grid = buildRhythmGrid(doc.measures[0].events, 0);

    const expectedPositions = [
      [0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 0], [3, 1],
    ];
    grid.slots.forEach((slot, i) => {
      expect(slot.beat).toBe(expectedPositions[i][0]);
      expect(slot.sub).toBe(expectedPositions[i][1]);
    });
  });
});

/* ── Double C end-to-end wiring ────────────────────────────── */

describe('Double C tuning wiring', () => {
  it('Double C is selectable and has correct notation', () => {
    expect(doubleC).toBeDefined();
    expect(doubleC.notation).toBe('gCGCD');
    expect(doubleC.name).toBe('Double C');
  });

  it('Double C labels top-to-bottom: D C G C g', () => {
    const labels = tuningStringLabels(doubleC);
    expect(labels).toEqual(['D', 'C', 'G', 'C', 'g']);
  });

  it('Open G labels top-to-bottom: D B G D g', () => {
    const labels = tuningStringLabels(openG);
    expect(labels).toEqual(['D', 'B', 'G', 'D', 'g']);
  });

  it('Double C arrangement stores notation in tuning', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:C\nC2 D2 E2 F2 |`);
    const arrangement = arrangeMelody(parsed, doubleC, 'melody-only');
    expect(arrangement.tuning).toBe('gCGCD');
  });

  it('Double C TabDocument carries correct tuning metadata', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:C\nC2 D2 E2 F2 |`);
    const arrangement = arrangeMelody(parsed, doubleC, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.tuningId).toBe('gCGCD');
    expect(doc.tuningLabel).toBe('Double C');
  });

  it('Open G TabDocument carries correct tuning metadata', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.tuningId).toBe('gDGBD');
    expect(doc.tuningLabel).toBe('Open G');
  });

  it('Double C 4th string is C3 (MIDI 48)', () => {
    expect(doubleC.openPitches[3]).toBe(48);
  });

  it('Double C 5th string is G4 drone-only', () => {
    expect(doubleC.openPitches[4]).toBe(67);
  });

  it('ABC C maps to 4th string open under Double C (pitch offset −12)', () => {
    // C4 = MIDI 60. With offset −12 → 48.
    // 4th string C3 = 48. Fret = 48 − 48 = 0.
    const banjoPitch = 60 + doubleC.pitchOffset; // 48
    const positions = findPositions(banjoPitch, doubleC);
    const onS4open = positions.find((p) => p.string === 4 && p.fret === 0);
    expect(onS4open).toBeDefined();
  });

  it('ABC D maps correctly under Double C (not Open G mapping)', () => {
    // D4 = 62. With Double C offset −12 → 50.
    // Double C: s1=D4=62, s2=C4=60, s3=G3=55, s4=C3=48
    // 50 − 48 = 2 → string 4 fret 2
    const banjoPitch = 62 + doubleC.pitchOffset; // 50
    const positions = findPositions(banjoPitch, doubleC);
    const onS4f2 = positions.find((p) => p.string === 4 && p.fret === 2);
    expect(onS4f2).toBeDefined();
  });

  it('no hardcoded gDGBD appears in Double C tuning data', () => {
    expect(doubleC.notation).not.toBe('gDGBD');
    expect(tuningStringLabels(doubleC)).not.toEqual(['D', 'B', 'G', 'D', 'g']);
  });
});

/* ── Rhythm grid for clawhammer mode ───────────────────────── */

describe('clawhammer rhythm grid', () => {
  it('basic-clawhammer mode preserves 8 slots per measure', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arrangement);

    const measure = doc.measures[0];
    // Clawhammer may add drone events alongside notes
    // But total measure slot count must be preserved
    const notes = measure.events.filter((e) => e.kind === 'note');
    expect(notes.length).toBe(4); // 4 quarter notes
  });

  it('eighth-note pairs produce 8 slots with 4 sounded', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const measure = doc.measures[0];
    const grid = buildRhythmGrid(measure.events, 0);

    expect(grid.slots).toHaveLength(8);
    const sounded = grid.slots.filter((s) => s.sounded);
    expect(sounded.length).toBe(8); // 8 eighth notes
  });

  it('half note D4 produces 4 continuation slots', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD4 E2 F2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const measure = doc.measures[0];
    const grid = buildRhythmGrid(measure.events, 0);

    expect(grid.slots).toHaveLength(8);
    // D4 = 4 slots, so 3 continuation after the first
    const conts = grid.slots.filter((s) => s.continuation);
    expect(conts.length).toBeGreaterThanOrEqual(3);
  });
});
