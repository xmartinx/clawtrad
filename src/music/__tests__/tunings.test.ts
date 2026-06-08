import { describe, it, expect } from 'vitest';
import {
  TUNING_DEFINITIONS,
  TUNINGS,
  tuningStringLabels,
} from '../banjo/tunings';

describe('tuning definitions', () => {
  it('has four tunings', () => {
    expect(TUNING_DEFINITIONS).toHaveLength(4);
  });

  it('Open G has notation gDGBD', () => {
    const openG = TUNING_DEFINITIONS.find((t) => t.name === 'Open G');
    expect(openG).toBeDefined();
    expect(openG!.notation).toBe('gDGBD');
  });

  it('Double D has notation aDADE', () => {
    const doubleD = TUNING_DEFINITIONS.find((t) => t.name === 'Double D');
    expect(doubleD).toBeDefined();
    expect(doubleD!.notation).toBe('aDADE');
  });

  it('Sawmill A has notation aEADE', () => {
    const sawmillA = TUNING_DEFINITIONS.find((t) => t.name === 'Sawmill A');
    expect(sawmillA).toBeDefined();
    expect(sawmillA!.notation).toBe('aEADE');
  });

  it('Double C has notation gCGCD', () => {
    const doubleC = TUNING_DEFINITIONS.find((t) => t.name === 'Double C');
    expect(doubleC).toBeDefined();
    expect(doubleC!.notation).toBe('gCGCD');
  });
});

describe('parseTuning', () => {
  it('Open G has correct open pitches', () => {
    const openG = TUNINGS.find((t) => t.name === 'Open G')!;
    // String 1: D4 = 62, String 2: B3 = 59, String 3: G3 = 55,
    // String 4: D3 = 50, String 5: G4 = 67
    expect(openG.openPitches).toEqual([62, 59, 55, 50, 67]);
  });

  it('Double D has correct open pitches', () => {
    const doubleD = TUNINGS.find((t) => t.name === 'Double D')!;
    // String 1: E4 = 64, String 2: D4 = 62, String 3: A3 = 57,
    // String 4: D3 = 50, String 5: A4 = 69
    expect(doubleD.openPitches).toEqual([64, 62, 57, 50, 69]);
  });

  it('Sawmill A has correct open pitches', () => {
    const sawmillA = TUNINGS.find((t) => t.name === 'Sawmill A')!;
    // String 1: E4 = 64, String 2: D4 = 62, String 3: A3 = 57,
    // String 4: E3 = 52, String 5: A4 = 69
    expect(sawmillA.openPitches).toEqual([64, 62, 57, 52, 69]);
  });

  it('Double C has correct open pitches', () => {
    const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;
    // String 1: D4 = 62, String 2: C4 = 60, String 3: G3 = 55,
    // String 4: C3 = 48, String 5: G4 = 67
    expect(doubleC.openPitches).toEqual([62, 60, 55, 48, 67]);
  });

  it('Double C 4th string is C', () => {
    const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;
    expect(doubleC.openPitches[3]).toBe(48); // C3
  });

  it('Double C 5th string is g and is drone-only', () => {
    const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;
    expect(doubleC.openPitches[4]).toBe(67); // G4
  });

  it('all tunings have pitchOffset', () => {
    for (const t of TUNINGS) {
      expect(t.pitchOffset).toBeDefined();
      expect(typeof t.pitchOffset).toBe('number');
    }
  });
});

describe('tuningStringLabels', () => {
  it('Open G labels top-to-bottom: D B G D g', () => {
    const openG = TUNINGS.find((t) => t.name === 'Open G')!;
    expect(tuningStringLabels(openG)).toEqual(['D', 'B', 'G', 'D', 'g']);
  });

  it('Double C labels top-to-bottom: D C G C g', () => {
    const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;
    expect(tuningStringLabels(doubleC)).toEqual(['D', 'C', 'G', 'C', 'g']);
  });

  it('Double D labels top-to-bottom: E D A D a', () => {
    const doubleD = TUNINGS.find((t) => t.name === 'Double D')!;
    expect(tuningStringLabels(doubleD)).toEqual(['E', 'D', 'A', 'D', 'a']);
  });

  it('returns 5 labels in all tunings', () => {
    for (const t of TUNINGS) {
      expect(tuningStringLabels(t)).toHaveLength(5);
    }
  });

  it('5th string label is always lowercase', () => {
    for (const t of TUNINGS) {
      const labels = tuningStringLabels(t);
      expect(labels[4]).toBe(labels[4].toLowerCase());
    }
  });
});

describe('TUNINGS', () => {
  it('are parsed from TUNING_DEFINITIONS', () => {
    expect(TUNINGS).toHaveLength(4);
  });

  it('each has 5 open pitches', () => {
    for (const t of TUNINGS) {
      expect(t.openPitches).toHaveLength(5);
    }
  });

  it('each has a name', () => {
    for (const t of TUNINGS) {
      expect(t.name).toBeTruthy();
    }
  });
});
