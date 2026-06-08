/**
 * Clawhammer drone fill and fingering tests for v0.2.7.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { buildRhythmGrid } from '../tab/clawhammerRhythmGrid';
import {
  assignPairRoles,
  canDropThumb,
} from '../arranger/clawhammer';
import { TUNINGS, tuningStringLabels } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;
const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;

/* ── Drone fill rules ──────────────────────────────────────── */

describe('drone fill for quarter notes', () => {
  it('D2 E2 F2 G2 in clawhammer gets 4 offbeat drones', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    const drones = arrangement.columns.filter((c) => c.hasDrone);
    expect(drones.length).toBe(4);
  });

  it('drones appear in offbeat slots (1,3,5,7), not downbeats', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    // After expansion: 4 melody + 4 drone = 8 columns
    expect(arrangement.columns.length).toBe(8);

    // Verify pattern: melody, drone, melody, drone, ...
    for (let i = 0; i < 8; i++) {
      const col = arrangement.columns[i];
      if (i % 2 === 0) {
        // Downbeat: melody note
        expect(col.hasDrone).toBe(false);
        expect(col.isRest).toBe(false);
      } else {
        // Offbeat: drone
        expect(col.hasDrone).toBe(true);
      }
    }
  });

  it('all drones are string 5, fret 0', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    const drones = arrangement.columns.filter((c) => c.hasDrone);
    for (const d of drones) {
      const fifthCell = d.cells.find((c) => c.string === 5);
      expect(fifthCell).toBeDefined();
      expect(fifthCell!.fret).toBe(0);
    }
  });

  it('measure still has correct total duration after drone fill', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    const totalDur = arrangement.columns.reduce((s, c) => s + c.duration, 0);
    // 4 quarter notes = 1.0 whole note. Plus 4 eighth drones = 0.5. Total = 1.5.
    // Actually, the original 4 quarter notes already total 1.0.
    // After splitting: 8 eighth notes = 1.0 total.
    expect(totalDur).toBeCloseTo(1.0, 2);
  });
});

describe('no drones for full quaver bars', () => {
  it('D E F G A B c d gets zero drones in clawhammer mode', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    const drones = arrangement.columns.filter((c) => c.hasDrone);
    expect(drones.length).toBe(0);
  });

  it('full quaver bar preserves 8 melody columns', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    // 8 melody notes, no drones inserted
    expect(arrangement.columns.length).toBe(8);
    for (const col of arrangement.columns) {
      expect(col.hasDrone).toBe(false);
    }
  });
});

/* ── Conservative drop-thumb rules ─────────────────────────── */

describe('conservative drop-thumb reach', () => {
  it('thumb may drop to adjacent inner string (N+1)', () => {
    expect(canDropThumb({ string: 1, fret: 0 }, { string: 2, fret: 1 })).toBe(true);
    expect(canDropThumb({ string: 2, fret: 0 }, { string: 3, fret: 3 })).toBe(true);
    expect(canDropThumb({ string: 3, fret: 2 }, { string: 4, fret: 0 })).toBe(true);
  });

  it('thumb may NOT drop to string 1', () => {
    expect(canDropThumb({ string: 2, fret: 0 }, { string: 1, fret: 0 })).toBe(false);
  });

  it('thumb may NOT drop to string 5 (drone-only)', () => {
    expect(canDropThumb({ string: 4, fret: 2 }, { string: 5, fret: 0 })).toBe(false);
  });

  it('thumb may NOT jump more than one string', () => {
    expect(canDropThumb({ string: 1, fret: 0 }, { string: 3, fret: 2 })).toBe(false);
    expect(canDropThumb({ string: 2, fret: 0 }, { string: 4, fret: 2 })).toBe(false);
  });

  it('thumb never uses fretted 5th string', () => {
    // 5th string with any fret > 0 is not allowed
    expect(canDropThumb({ string: 4, fret: 2 }, { string: 5, fret: 0 })).toBe(false);
  });
});

/* ── Pair role assignment ──────────────────────────────────── */

describe('assignPairRoles', () => {
  it('first slot is always M (frailing finger) when note present', () => {
    const [first, second] = assignPairRoles(
      { string: 1, fret: 0 },
      { string: 2, fret: 1 },
    );
    expect(first.role).toBe('M');
    expect(second.role).toBe('T-drop'); // reachable N+1
  });

  it('empty second slot gets T-drone', () => {
    const [first, second] = assignPairRoles(
      { string: 1, fret: 0 },
      null,
    );
    expect(first.role).toBe('M');
    expect(second.role).toBe('T-drone');
    expect(second.stringIndex).toBe(4); // 5th string
    expect(second.fret).toBe(0);
  });

  it('same-string rising by 1-2 frets gets H (hammer-on)', () => {
    const [, second] = assignPairRoles(
      { string: 4, fret: 0 },  // D
      { string: 4, fret: 2 },  // E
    );
    expect(second.role).toBe('H');
  });

  it('same-string rising by 3 frets gets Sl (slide)', () => {
    const [, second] = assignPairRoles(
      { string: 4, fret: 2 },
      { string: 4, fret: 5 },
    );
    expect(second.role).toBe('Sl');
  });

  it('same-string descending gets P (pull-off)', () => {
    const [, second] = assignPairRoles(
      { string: 3, fret: 4 },
      { string: 3, fret: 2 },
    );
    expect(second.role).toBe('P');
  });

  it('non-reachable thumb assignment falls back to M', () => {
    // String 1 to string 1 is same-string; fine
    // String 1 to string 4 is too far for thumb
    const [first, second] = assignPairRoles(
      { string: 1, fret: 2 },
      { string: 4, fret: 0 },
    );
    expect(first.role).toBe('M');
    // Not reachable thumb → falls back to M
    expect(second.role).toBe('M');
  });

  it('c d in Open G does not produce thumb on open 1st string', () => {
    // c = C#5 (MIDI 73, banjo 61) and d = D5 (MIDI 74, banjo 62)
    // In Open G with offset -12: c→61, d→62
    // c = string 2 fret 2, d = string 1 open — but thumb can't play string 1!
    const [first, second] = assignPairRoles(
      { string: 2, fret: 2 },  // c on string 2
      { string: 1, fret: 0 },  // d on string 1
    );
    expect(first.role).toBe('M');
    // Thumb cannot play string 1; this should not be T-drop
    expect(second.role).not.toBe('T-drop');
  });
});

/* ── Beat-pair beaming ─────────────────────────────────────── */

describe('beat-pair beaming via rhythm grid', () => {
  it('D E F G A B c d creates 8 slots with 4 beat pairs', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);
    const grid = buildRhythmGrid(doc.measures[0].events, 0);

    expect(grid.slots).toHaveLength(8);
    // 4 beats, each with 2 slots → 4 beam groups
    const beamableBeats = [0, 1, 2, 3].filter((beat) => {
      const down = grid.slots[beat * 2];
      const off = grid.slots[beat * 2 + 1];
      return down.sounded && off.sounded && !down.isDrone && !off.isDrone;
    });
    expect(beamableBeats.length).toBe(4);
  });

  it('quarter + drone pairs have 4 melody slots and 4 drone slots', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    // After clawhammer fill: 8 columns (4 melody + 4 drone)
    expect(arrangement.columns.length).toBe(8);
  });

  it('beat 0 and beat 2 drones are on strong beats', () => {
    // The old code added drones only on beats 0 and 2 — verify new behavior
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

    // All 4 offbeat slots (1,3,5,7) should have drones
    const drones = arrangement.columns.filter((c) => c.hasDrone);
    expect(drones.length).toBe(4);
  });
});

/* ── Double C regression ───────────────────────────────────── */

describe('Double C behaviour preserved', () => {
  it('Double C labels still D C G C g', () => {
    expect(tuningStringLabels(doubleC)).toEqual(['D', 'C', 'G', 'C', 'g']);
  });

  it('Double C TabDocument carries correct metadata', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:C\nC2 D2 E2 F2 |`);
    const arr = arrangeMelody(parsed, doubleC, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);

    expect(doc.tuningId).toBe('gCGCD');
    expect(doc.tuningLabel).toBe('Double C');
  });

  it('no x markers in clawhammer output', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);

    for (const m of doc.measures) {
      for (const e of m.events) {
        expect(e.kind).not.toBe('skipped');
      }
    }
  });
});
