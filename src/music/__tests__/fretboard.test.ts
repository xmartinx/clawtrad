import { describe, it, expect } from 'vitest';
import { findPositions, openPitch, MAX_FRET } from '../banjo/fretboard';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;
const doubleD = TUNINGS.find((t) => t.name === 'Double D')!;

describe('fretboard mapping', () => {
  describe('MAX_FRET', () => {
    it('is 7', () => {
      expect(MAX_FRET).toBe(7);
    });
  });

  describe('findPositions', () => {
    it('finds open D4 (62) in Open G on string 1 fret 0', () => {
      const positions = findPositions(62, openG);
      const onString1 = positions.find((p) => p.string === 1 && p.fret === 0);
      expect(onString1).toBeDefined();
    });

    it('finds B3 (59) on string 2 open in Open G', () => {
      const positions = findPositions(59, openG);
      const onString2 = positions.find((p) => p.string === 2 && p.fret === 0);
      expect(onString2).toBeDefined();
    });

    it('finds G3 (55) on string 3 open in Open G', () => {
      const positions = findPositions(55, openG);
      const onString3 = positions.find((p) => p.string === 3 && p.fret === 0);
      expect(onString3).toBeDefined();
    });

    it('finds E4 (64) on string 1 fret 2 in Open G', () => {
      const positions = findPositions(64, openG);
      const onString1f2 = positions.find((p) => p.string === 1 && p.fret === 2);
      expect(onString1f2).toBeDefined();
    });

    it('returns multiple positions for G4 (67) in Open G', () => {
      // G4 can be: string 1 fret 5 (D4+5=67), string 5 open (G4=67)
      const positions = findPositions(67, openG);
      expect(positions.length).toBeGreaterThanOrEqual(2);
      expect(positions.some((p) => p.string === 5 && p.fret === 0)).toBe(true);
      expect(positions.some((p) => p.string === 1 && p.fret === 5)).toBe(true);
    });

    it('returns empty array for notes too low for the tuning', () => {
      // C2 = 36 is way below any banjo string
      const positions = findPositions(36, openG);
      expect(positions).toHaveLength(0);
    });

    it('returns empty array for notes requiring fret > 7', () => {
      // C6 = 84 is too high
      const positions = findPositions(84, openG);
      expect(positions).toHaveLength(0);
    });

    it('sorts by fret then string', () => {
      // A4 (69) in Open G: string 1 fret 7, string 5 fret 2
      const positions = findPositions(69, openG);
      // string 5 fret 2 should come before string 1 fret 7
      const idx5 = positions.findIndex((p) => p.string === 5);
      const idx1 = positions.findIndex((p) => p.string === 1);
      if (idx5 >= 0 && idx1 >= 0) {
        expect(idx5).toBeLessThan(idx1);
      }
    });

    it('works in Double D tuning for D4', () => {
      // D4 = 62: string 2 open (D4=62) in Double D
      const positions = findPositions(62, doubleD);
      const onString2 = positions.find((p) => p.string === 2 && p.fret === 0);
      expect(onString2).toBeDefined();
    });
  });

  describe('openPitch', () => {
    it('returns correct open pitch for each string in Open G', () => {
      expect(openPitch(1, openG)).toBe(62); // D4
      expect(openPitch(2, openG)).toBe(59); // B3
      expect(openPitch(3, openG)).toBe(55); // G3
      expect(openPitch(4, openG)).toBe(50); // D3
      expect(openPitch(5, openG)).toBe(67); // G4
    });
  });
});
