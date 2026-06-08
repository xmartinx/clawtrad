import { describe, it, expect } from 'vitest';
import {
  TUNING_DEFINITIONS,
  TUNINGS,
} from '../banjo/tunings';

describe('tuning definitions', () => {
  it('has three tunings', () => {
    expect(TUNING_DEFINITIONS).toHaveLength(3);
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
});

describe('TUNINGS', () => {
  it('are parsed from TUNING_DEFINITIONS', () => {
    expect(TUNINGS).toHaveLength(3);
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
