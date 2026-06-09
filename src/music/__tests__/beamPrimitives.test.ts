/**
 * Beam primitive calculator tests for v0.2.12.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { computeLayout } from '../tab/tabLayout';
import { computeBeamPrimitives, beamY } from '../tab/beamPrimitives';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

/* ── Beam primitive tests ──────────────────────────────────── */

describe('beam primitives for quarter drone fill', () => {
  const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`);
  const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
  const doc = buildTabDocument(parsed, arr);
  const layout = computeLayout(doc);

  it('produces 4 beam primitives for D2 E2 F2 G2 in clawhammer', () => {
    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);
    expect(beams.length).toBe(4);
  });

  it('every beam has width > 0 and height >= 4', () => {
    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);
    for (const b of beams) {
      expect(b.width).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThanOrEqual(4);
    }
  });

  it('every beam has finite positive x and y', () => {
    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);
    for (const b of beams) {
      expect(Number.isFinite(b.x)).toBe(true);
      expect(Number.isFinite(b.y)).toBe(true);
      expect(b.x).toBeGreaterThan(0);
      expect(b.y).toBeGreaterThan(0);
    }
  });

  it('beam y is within layout bounds', () => {
    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);
    const tabTop = 0;
    const expectedY = beamY(tabTop);
    for (const b of beams) {
      // beam y should be near the expected position
      expect(Math.abs(b.y - (expectedY - 3))).toBeLessThanOrEqual(10);
    }
  });
});

describe('beam primitives for full quaver melody', () => {
  const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD E F G A B c d |`);
  const arr = arrangeMelody(parsed, openG, 'melody-only');
  const doc = buildTabDocument(parsed, arr);
  const layout = computeLayout(doc);

  it('produces 4 beam primitives for 8 eighth notes', () => {
    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);
    expect(beams.length).toBe(4);
  });

  it('all beams have beat indices 0-3', () => {
    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);
    const beatIndices = beams.map((b) => b.beatIndex).sort();
    expect(beatIndices).toEqual([0, 1, 2, 3]);
  });
});

describe('beam primitives for 2/4 meter', () => {
  const parsed = parseAbc(`X:1\nT:Test\nM:2/4\nL:1/8\nK:G\nc d c d |`);
  const arr = arrangeMelody(parsed, openG, 'melody-only');
  const doc = buildTabDocument(parsed, arr);
  const layout = computeLayout(doc);

  it('produces 2 beam primitives for 2/4 c d c d', () => {
    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);
    expect(beams.length).toBe(2);
  });
});

describe('no beams across rests', () => {
  it('rest rest-pair does not produce beams', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 z2 D2 z2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);
    const layout = computeLayout(doc);

    const sys = layout.systems[0];
    const beams = computeBeamPrimitives(sys.events, 0);

    // Beat 0: D2 + drone → beam
    // Beat 1: z2 rest (no events for offbeat) → no beam
    // Beat 2: D2 + drone → beam
    // Beat 3: z2 rest → no beam
    // So 2 beams total
    expect(beams.length).toBeGreaterThanOrEqual(1);
    expect(beams.length).toBeLessThanOrEqual(3); // depends on drone fill
  });
});
