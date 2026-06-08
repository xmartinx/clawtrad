/**
 * Scoring and dynamic-programming tests for v0.1.1.
 */
import { describe, it, expect } from 'vitest';
import {
  intrinsicScore,
  transitionScore,
  selectBestPosition,
  findOptimalPath,
} from '../arranger/scoring';
import type { FretPosition } from '../banjo/fretboard';
import { findPositions } from '../banjo/fretboard';
import { TUNINGS } from '../banjo/tunings';
import { parseAbc } from '../abc/parseAbc';
import { arrangeMelody } from '../arranger/arrangeMelody';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

describe('intrinsicScore', () => {
  it('open melody string scores higher than high frets', () => {
    const open = { string: 1, fret: 0, pitch: 62 };
    const high = { string: 1, fret: 7, pitch: 69 };
    expect(intrinsicScore(open)).toBeGreaterThan(intrinsicScore(high));
  });

  it('string 1–3 scores higher than string 4 for same fret', () => {
    const s3 = { string: 3, fret: 2, pitch: 57 };
    const s4 = { string: 4, fret: 2, pitch: 52 };
    expect(intrinsicScore(s3)).toBeGreaterThan(intrinsicScore(s4));
  });

  it('5th string scored very low', () => {
    const s5 = { string: 5, fret: 0, pitch: 67 };
    const s1 = { string: 1, fret: 5, pitch: 67 };
    expect(intrinsicScore(s1)).toBeGreaterThan(intrinsicScore(s5));
  });
});

describe('transitionScore', () => {
  it('same string no jump is best', () => {
    const a = { string: 1, fret: 2, pitch: 64 };
    const b = { string: 1, fret: 2, pitch: 64 };
    const sameStringBigJump = transitionScore(a, { string: 2, fret: 7, pitch: 66 });
    expect(transitionScore(a, b)).toBeGreaterThan(sameStringBigJump);
  });

  it('smaller fret jump scores better', () => {
    const a = { string: 1, fret: 0, pitch: 62 };
    const near = { string: 1, fret: 2, pitch: 64 };
    const far = { string: 1, fret: 5, pitch: 67 };
    expect(transitionScore(a, near)).toBeGreaterThan(transitionScore(a, far));
  });

  it('smaller string jump scores better', () => {
    const a = { string: 1, fret: 0, pitch: 62 };
    const sameString = { string: 1, fret: 5, pitch: 67 };
    const diffString = { string: 3, fret: 5, pitch: 60 };
    // Both have same fret jump but different string jump
    expect(transitionScore(a, sameString)).toBeGreaterThan(transitionScore(a, diffString));
  });
});

describe('selectBestPosition (greedy)', () => {
  it('returns null for empty candidates', () => {
    expect(selectBestPosition([], null)).toBeNull();
  });

  it('selects the only candidate when one is available', () => {
    const cand = [{ string: 1, fret: 0, pitch: 62 }];
    expect(selectBestPosition(cand, null)).toEqual(cand[0]);
  });

  it('prefers open string over fretted for D4 in Open G', () => {
    // D4=62: string 1 open (62), string 4 fret 12 (not playable), etc.
    const candidates = findPositions(62, openG);
    const best = selectBestPosition(candidates, null);
    expect(best).not.toBeNull();
    expect(best!.fret).toBe(0);
    expect(best!.string).toBe(1);
  });
});

describe('findOptimalPath (DP)', () => {
  it('returns empty path for empty input', () => {
    const result = findOptimalPath([]);
    expect(result.path).toEqual([]);
    expect(result.unplayableIndices).toEqual([]);
  });

  it('returns a path of same length as input', () => {
    // D4=62, E4=64, F#4=66 in Open G
    const cand62 = findPositions(62, openG);
    const cand64 = findPositions(64, openG);
    const cand66 = findPositions(66, openG);
    const result = findOptimalPath([cand62, cand64, cand66]);
    expect(result.path).toHaveLength(3);
    result.path.forEach((p) => expect(p).not.toBeNull());
  });

  it('identifies unplayable notes', () => {
    const candPlayable = findPositions(62, openG);
    const candUnplayable: FretPosition[] = []; // C2=36, too low
    const result = findOptimalPath([candPlayable, candUnplayable, candPlayable]);
    expect(result.unplayableIndices).toContain(1);
    expect(result.path[0]).not.toBeNull();
    expect(result.path[1]).toBeNull();
    expect(result.path[2]).not.toBeNull();
  });

  it('DP chooses smoother path than greedy for a known case', () => {
    // Synthetic melody where the greedy algorithm would jump around
    // but DP should stay on fewer strings.
    // Notes: B3(59) G4(67) A4(69) G4(67) — a lick on the top strings
    const notes = [59, 67, 69, 67];
    const allCands = notes.map((p) => findPositions(p, openG));

    // Greedy: for each note, pick best local choice
    const greedyPath: (FretPosition | null)[] = [];
    let prev: FretPosition | null = null;
    for (const cand of allCands) {
      const best = selectBestPosition(cand, prev);
      greedyPath.push(best);
      prev = best;
    }

    // DP: pick globally optimal path
    const dpResult = findOptimalPath(allCands);

    // Both should produce valid paths
    expect(greedyPath.every((p) => p !== null)).toBe(true);
    expect(dpResult.path.every((p) => p !== null)).toBe(true);

    // Both paths should maintain note order and pitch
    for (let i = 0; i < notes.length; i++) {
      expect(dpResult.path[i]!.pitch).toBe(notes[i]);
      expect(greedyPath[i]!.pitch).toBe(notes[i]);
    }

    // DP should produce total cost ≤ greedy total cost
    const greedyCost = computePathCost(greedyPath as FretPosition[]);
    const dpCost = dpResult.totalCost;
    expect(dpCost).toBeLessThanOrEqual(greedyCost);
  });

  it('avoids 5th string as melody in DP', () => {
    // G4 = 67: available on string 5 open and string 1 fret 5
    // DP should prefer string 1 fret 5 over string 5 open for melody
    const cand67 = findPositions(67, openG);
    // There should be at least 2 candidates: string 5 open, string 1 fret 5
    expect(cand67.length).toBeGreaterThanOrEqual(2);

    // Create a sequence of G4 notes
    const result = findOptimalPath([cand67, cand67, cand67]);
    for (const p of result.path) {
      expect(p).not.toBeNull();
      // Should not use 5th string for melody if a melody-string option exists
      expect(p!.string).not.toBe(5);
    }
  });

  it('melody notes remain in order', () => {
    // D4(62) E4(64) F#4(66) G4(67) A4(69) B4(71)
    const pitches = [62, 64, 66, 67, 69, 59]; // B3 at the end for variety
    const allCands = pitches.map((p) => findPositions(p, openG));
    const result = findOptimalPath(allCands);

    for (let i = 0; i < pitches.length; i++) {
      expect(result.path[i]).not.toBeNull();
      if (result.path[i]) {
        expect(result.path[i]!.pitch).toBe(pitches[i]);
      }
    }
  });
});

describe('DP in real arrangement context', () => {
  it('produces valid arrangement for simple D reel', () => {
    const tune = `X:1\nT:DP Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`;
    const parsed = parseAbc(tune);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');

    expect(arrangement.columns.length).toBe(parsed.notes.length);
    expect(arrangement.warnings.filter((w) => w.includes('no playable position')).length).toBe(0);
  });

  it('produces smoother transitions than would be expected from random', () => {
    // A scale in D major: D4 E4 F#4 G4 A4 B4 C#5 D5
    const tune = `X:1\nT:Scale\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`;
    const parsed = parseAbc(tune);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');

    // Count string changes
    let stringChanges = 0;
    for (let i = 1; i < arrangement.columns.length; i++) {
      const prevPlayed = arrangement.columns[i - 1].cells.find((c) => c.fret >= 0);
      const currPlayed = arrangement.columns[i].cells.find((c) => c.fret >= 0);
      if (prevPlayed && currPlayed && prevPlayed.string !== currPlayed.string) {
        stringChanges++;
      }
    }

    // A D major scale played smoothly should have relatively few string changes
    // (expected: a good player might use 1-2 string changes across an octave)
    // We'll be lenient and expect fewer than 4 string changes
    expect(stringChanges).toBeLessThan(4);
  });
});

/** Compute total cost of a path using the scoring model. */
function computePathCost(path: FretPosition[]): number {
  let cost = 0;
  for (let i = 0; i < path.length; i++) {
    cost += -intrinsicScore(path[i]);
    if (i > 0) {
      cost += -transitionScore(path[i - 1], path[i]);
    }
  }
  return cost;
}
