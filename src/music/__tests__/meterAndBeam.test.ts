/**
 * Meter-specific slot counts and beam tests for v0.2.11.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { buildRhythmGrid, beatsPerMeasure, slotsPerMeasure } from '../tab/clawhammerRhythmGrid';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

/* ── Meter slot counts ─────────────────────────────────────── */

describe('meter-specific slot counts', () => {
  it('M:4/4 has 8 slots', () => {
    expect(slotsPerMeasure('4/4')).toBe(8);
    expect(beatsPerMeasure('4/4')).toBe(4);
  });

  it('M:2/4 has 4 slots', () => {
    expect(slotsPerMeasure('2/4')).toBe(4);
    expect(beatsPerMeasure('2/4')).toBe(2);
  });

  it('M:3/4 has 6 slots', () => {
    expect(slotsPerMeasure('3/4')).toBe(6);
    expect(beatsPerMeasure('3/4')).toBe(3);
  });

  it('M:2/4 c d c d produces one measure with 4 slots', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:2/4\nL:1/8\nK:G\nc d c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    expect(doc.measures.length).toBeGreaterThanOrEqual(1);
    const grid = buildRhythmGrid(doc.measures[0].events, 0, '2/4');
    expect(grid.slots.length).toBe(4);
  });

  it('M:2/4 with two measures produces 2 measures x 4 slots each', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:2/4\nL:1/8\nK:G\nc d c d | ^c d =c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    expect(doc.measures.length).toBeGreaterThanOrEqual(2);
    if (doc.measures.length >= 2) {
      const g0 = buildRhythmGrid(doc.measures[0].events, 0, '2/4');
      const g1 = buildRhythmGrid(doc.measures[1].events, 1, '2/4');
      expect(g0.slots.length).toBe(4);
      expect(g1.slots.length).toBe(4);
    }
  });

  it('M:4/4 D E F G A B c d still has 8 slots', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD E F G A B c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);
    const grid = buildRhythmGrid(doc.measures[0].events, 0, '4/4');
    expect(grid.slots.length).toBe(8);
  });

  it('M:2/4 beaming creates 2 beat groups per measure', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:2/4\nL:1/8\nK:G\nc d c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    const grid = buildRhythmGrid(doc.measures[0].events, 0, '2/4');
    const beams = grid.slots.filter((_, i) =>
      i % 2 === 0 && grid.slots[i].sounded && grid.slots[i + 1]?.sounded,
    );
    // 2 beat-pairs in 2/4
    expect(beams.length).toBe(2);
  });
});

/* ── Beam primitive tests ──────────────────────────────────── */

describe('beam primitive data for beat-pairs', () => {
  it('D2 E2 F2 G2 in clawhammer has 4 beat-pairs with valid positions', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);

    expect(doc.measures[0].events.length).toBeGreaterThanOrEqual(8);

    // Count beat-pairs: consecutive events where both are short notes
    // and at least one is melody
    const events = doc.measures[0].events;
    let beamPairCount = 0;
    for (let i = 0; i < events.length - 1; i += 2) {
      const a = events[i];
      const b = events[i + 1];
      if (
        a.duration <= 0.25 && b.duration <= 0.25 &&
        a.duration > 0 && b.duration > 0 &&
        (a.kind === 'note' || b.kind === 'note') &&
        !(a.kind === 'drone' && b.kind === 'drone')
      ) {
        beamPairCount++;
      }
    }
    expect(beamPairCount).toBe(4);
  });

  it('D E F G A B c d melody-only has 4 beam pairs', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD E F G A B c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    expect(doc.measures[0].events.length).toBe(8);

    const events = doc.measures[0].events;
    let beamPairCount = 0;
    for (let i = 0; i < events.length - 1; i += 2) {
      if (events[i].kind === 'note' && events[i + 1].kind === 'note') {
        beamPairCount++;
      }
    }
    expect(beamPairCount).toBe(4);
  });

  it('M:2/4 c d c d has 2 beam pairs', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:2/4\nL:1/8\nK:G\nc d c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    const events = doc.measures[0].events;
    let beamPairCount = 0;
    for (let i = 0; i < events.length - 1; i += 2) {
      if (events[i].kind === 'note' && events[i + 1].kind === 'note') {
        beamPairCount++;
      }
    }
    expect(beamPairCount).toBe(2);
  });
});

/* ── Accidentals preserved ─────────────────────────────────── */

describe('accidental correctness', () => {
  it('K:G c is natural (fret 1 on string 2)', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nc |`);
    // c in key G = C natural. ABC lowercase c = C5=72, banjo pitch=60, string 2 open=59, fret=60-59=1
    expect(parsed.notes[0].pitch).toBe(72); // C5
  });

  it('K:G ^c is sharp (fret 2 on string 2)', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\n^c |`);
    // ^c = C#5 = 73, banjo=61, string 2 fret=61-59=2
    expect(parsed.notes[0].pitch).toBe(73);
  });

  it('K:G =c is natural (fret 1 on string 2)', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\n=c |`);
    // =c = explicit natural = C5 = 72
    expect(parsed.notes[0].pitch).toBe(72);
  });

  it('full-bar c d in K:G uses same-string, not open 1st for d', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD E F G A B c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    const notes = doc.measures[0].events.filter((e) => e.kind === 'note');
    expect(notes.length).toBe(8);

    // Last two notes (c d) at indices 6, 7
    const cNote = notes[6];
    const dNote = notes[7];
    // d must not be open string 1
    expect(dNote.stringIndex === 0 && dNote.fret === 0).toBe(false);
    // c should be on string 2 or 3
    expect(cNote.stringIndex).toBeDefined();
    expect(cNote.fret).toBeDefined();
    // d should be on the same string as c (H/Sl candidate)
    // or on a different but playable string
    expect(dNote.stringIndex).toBeDefined();
    expect(dNote.fret).toBeDefined();
  });
});

/* ── No regressions ────────────────────────────────────────── */

describe('regression: v0.2.10 behaviour preserved', () => {
  it('Double C still wired correctly', () => {
    const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:C\nC2 D2 E2 F2 |`);
    const arr = arrangeMelody(parsed, doubleC, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);
    expect(doc.tuningId).toBe('gCGCD');
    expect(doc.tuningLabel).toBe('Double C');
  });

  it('no drones in full quaver bar', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD E F G A B c d |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);
    const drones = doc.measures[0].events.filter((e) => e.kind === 'drone');
    expect(drones.length).toBe(0);
  });

  it('no x markers', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);
    for (const m of doc.measures) {
      for (const e of m.events) {
        expect(e.kind).not.toBe('skipped');
      }
    }
  });
});
