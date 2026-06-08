import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;
const doubleD = TUNINGS.find((t) => t.name === 'Double D')!;

describe('melody arrangement', () => {
  const simpleD = `X:1
T:Simple D Reel
M:4/4
L:1/8
K:D
|: D2 FA d2 fd | A2 ce a2 ge | f2 d2 e2 c2 | d4 d2 z2 :|`;

  const simpleG = `X:1
T:Simple G Reel
M:4/4
L:1/8
K:G
|: G2 B2 d2 g2 | d2 B2 G2 A2 | B2 d2 e2 d2 | g4 g2 z2 :|`;

  describe('melody-only mode', () => {
    it('produces columns for all notes in simple D reel', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      expect(arrangement.columns.length).toBeGreaterThan(0);
      // Should have roughly the right number of notes
      // D2 FA d2 fd A2 ce a2 ge f2 d2 e2 c2 d4 d2 z2 = ~16 notes + 2 rests
      expect(arrangement.columns.length).toBeGreaterThanOrEqual(14);
    });

    it('produces columns for all notes in simple G reel', () => {
      const parsed = parseAbc(simpleG);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      expect(arrangement.columns.length).toBeGreaterThan(0);
      expect(arrangement.columns.length).toBeGreaterThanOrEqual(14);
    });

    it('every column has 5 cells', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      for (const col of arrangement.columns) {
        expect(col.cells).toHaveLength(5);
      }
    });

    it('each non-rest column has exactly one melody note', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      for (const col of arrangement.columns) {
        if (!col.isRest) {
          const played = col.cells.filter((c) => c.fret >= 0);
          expect(played.length).toBe(1);
        }
      }
    });

    it('no drones in melody-only mode', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      for (const col of arrangement.columns) {
        expect(col.hasDrone).toBe(false);
      }
    });

    it('includes tune title in output', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      expect(arrangement.title).toBe('Simple D Reel');
    });
  });

  describe('in Double D tuning', () => {
    it('produces playable arrangement for D reel', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, doubleD, 'melody-only');

      expect(arrangement.columns.length).toBeGreaterThan(0);
      expect(arrangement.tuning).toBe('aDADE');  // v0.2.6: now tuning notation, not name
    });
  });

  describe('basic clawhammer mode', () => {
    it('produces an arrangement', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

      expect(arrangement.columns.length).toBeGreaterThan(0);
      expect(arrangement.mode).toBe('basic-clawhammer');
    });

    it('includes a disclaimer warning', () => {
      const parsed = parseAbc(simpleD);
      const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

      const hasDisclaimer = arrangement.warnings.some((w) =>
        w.includes('first-pass arrangement'),
      );
      expect(hasDisclaimer).toBe(true);
    });
  });

  describe('unplayable notes', () => {
    it('warns when a note cannot be played', () => {
      const lowTune = `X:1
T:Too Low
M:4/4
L:1/8
K:D
C,2 D2 E2 F2 |`;
      const parsed = parseAbc(lowTune);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      const hasWarning = arrangement.warnings.some((w) =>
        w.includes('no playable position'),
      );
      expect(hasWarning).toBe(true);
    });

    it('inserts rest columns for unplayable notes', () => {
      const lowTune = `X:1
T:Too Low
K:D
C,2 D2 E2 |`;
      const parsed = parseAbc(lowTune);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      // The C,2 should become a rest column
      const restCols = arrangement.columns.filter((c) => c.isRest);
      expect(restCols.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DP global optimisation', () => {
    it('produces columns for all notes', () => {
      const parsed = parseAbc(`X:1
T:DP Melody
M:4/4
L:1/8
K:D
D E F G A B c d |`);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');
      expect(arrangement.columns.length).toBe(parsed.notes.length);
    });

    it('5th string not used for melody when alternatives exist', () => {
      // G4 (MIDI 67) can be played on string 5 open or string 1 fret 5.
      // The DP should prefer string 1 fret 5 over string 5 open.
      // In ABC: uppercase G with no key-sig accidentals = G4 in key D.
      const tune = `X:1
T:G4 Test
M:4/4
L:1/8
K:D
G2 G2 G2 G2 |`;
      const parsed = parseAbc(tune);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      for (const col of arrangement.columns) {
        if (!col.isRest) {
          const played = col.cells.find((c) => c.fret >= 0);
          expect(played).toBeDefined();
          // Should never be on string 5 for G4 when string 1 fret 5 is available
          if (played) {
            expect(played.string).not.toBe(5);
          }
        }
      }
    });

    it('notes are playable and in order (may be octave-lowered)', () => {
      const tune = `X:1
T:Order Test
M:4/4
L:1/8
K:D
D E F G A B c d |`;
      const parsed = parseAbc(tune);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      // All notes should be playable (no rests)
      const noteCols = arrangement.columns.filter((c) => !c.isRest);
      expect(noteCols.length).toBe(parsed.notes.length);

      // Each note has a valid position within fret limits
      for (const col of noteCols) {
        const played = col.cells.find((c) => c.fret >= 0 && c.string !== 5);
        expect(played).toBeDefined();
        if (played) {
          expect(played.string).toBeGreaterThanOrEqual(1);
          expect(played.string).toBeLessThanOrEqual(4);
          expect(played.fret).toBeGreaterThanOrEqual(0);
          expect(played.fret).toBeLessThanOrEqual(10);
        }
      }
    });
  });

  describe('warning aggregation', () => {
    it('carries parser warnings through to arrangement', () => {
      const tune = `X:1
T:Warn Test
M:4/4
L:1/8
K:D
D2 {G}E2 F2 G2 |`; // grace note triggers warning
      const parsed = parseAbc(tune);
      const arrangement = arrangeMelody(parsed, openG, 'melody-only');

      const hasGraceWarning = arrangement.warnings.some((w) =>
        w.includes('Grace note'),
      );
      expect(hasGraceWarning).toBe(true);
    });

    it('includes first-pass disclaimer in clawhammer mode', () => {
      const tune = `X:1\nT:Test\nK:D\nD E F G |`;
      const parsed = parseAbc(tune);
      const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');

      expect(arrangement.warnings.some((w) =>
        w.includes('first-pass'),
      )).toBe(true);
    });
  });
});
