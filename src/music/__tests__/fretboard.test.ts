import { describe, it, expect } from 'vitest';
import { findPositions, findDronePosition, openPitch, maxFretForString } from '../banjo/fretboard';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;
const doubleD = TUNINGS.find((t) => t.name === 'Double D')!;

describe('fretboard mapping (v0.2.4)', () => {
  describe('maxFretForString', () => {
    it('strings 1-2 allow fret 10', () => {
      expect(maxFretForString(1)).toBe(10);
      expect(maxFretForString(2)).toBe(10);
    });

    it('strings 3-4 allow fret 7', () => {
      expect(maxFretForString(3)).toBe(7);
      expect(maxFretForString(4)).toBe(7);
    });

    it('string 5 allows fret 0 only', () => {
      expect(maxFretForString(5)).toBe(0);
    });
  });

  describe('findPositions (melody only, strings 1–4)', () => {
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

    it('EXCLUDES string 5 from melody candidates', () => {
      // G4 = 67: string 1 fret 5 (OK), but string 5 must NOT appear
      const positions = findPositions(67, openG);
      expect(positions.some((p) => p.string === 5)).toBe(false);
      // Should still find string 1
      expect(positions.some((p) => p.string === 1)).toBe(true);
    });

    it('returns empty for notes too low', () => {
      const positions = findPositions(36, openG);
      expect(positions).toHaveLength(0);
    });

    it('returns empty for notes too high', () => {
      const positions = findPositions(96, openG);
      expect(positions).toHaveLength(0);
    });

    it('allows frets up to 10 on string 1', () => {
      // D4=62 open, +10 = 72 (C5). Check fret 10 is allowed.
      const positions = findPositions(72, openG);
      const on1f10 = positions.find((p) => p.string === 1 && p.fret === 10);
      expect(on1f10).toBeDefined();
    });

    it('allows frets up to 10 on string 2', () => {
      // B3=59 open, +10 = 69 (A4)
      const positions = findPositions(69, openG);
      const on2f10 = positions.find((p) => p.string === 2 && p.fret === 10);
      expect(on2f10).toBeDefined();
    });

    it('limits strings 3-4 to fret 7', () => {
      // G3=55 open, +8 = 63 — should NOT be a candidate on string 3
      const positions = findPositions(63, openG);
      const on3f8 = positions.find((p) => p.string === 3 && p.fret === 8);
      expect(on3f8).toBeUndefined();
    });

    it('sorts by fret then string', () => {
      const positions = findPositions(69, openG);
      for (let i = 1; i < positions.length; i++) {
        const a = positions[i - 1];
        const b = positions[i];
        if (a.fret !== b.fret) {
          expect(a.fret).toBeLessThanOrEqual(b.fret);
        }
      }
    });

    it('works in Double D tuning for D4', () => {
      const positions = findPositions(62, doubleD);
      const onString2 = positions.find((p) => p.string === 2 && p.fret === 0);
      expect(onString2).toBeDefined();
    });
  });

  describe('findDronePosition', () => {
    it('finds G4 (67) on string 5 open in Open G', () => {
      const pos = findDronePosition(67, openG);
      expect(pos).not.toBeNull();
      expect(pos!.string).toBe(5);
      expect(pos!.fret).toBe(0);
    });

    it('returns null for non-matching pitch', () => {
      const pos = findDronePosition(68, openG); // G#4, not the 5th string pitch
      expect(pos).toBeNull();
    });

    it('returns null for non-open string 5 pitch', () => {
      // C5 = 72, not the open 5th string pitch
      const pos = findDronePosition(72, openG);
      expect(pos).toBeNull();
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
