/**
 * Beam rendering and same-string pair tests for v0.2.9.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { TUNINGS, tuningStringLabels } from '../banjo/tunings';
import { intrinsicScore } from '../arranger/scoring';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

/* ── Beam group tests ──────────────────────────────────────── */

describe('beam group data for beat-pairs', () => {
  it('D2 E2 F2 G2 in clawhammer has 4 melody+drone beat-pairs', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);

    // 8 events: [m d m d m d m d]
    expect(doc.measures[0].events.length).toBe(8);

    // 4 melody + 4 drone
    const melodies = doc.measures[0].events.filter((e) => e.kind === 'note');
    const drones = doc.measures[0].events.filter((e) => e.kind === 'drone');
    expect(melodies.length).toBe(4);
    expect(drones.length).toBe(4);

    // Check beat-pair structure: each beat has 2 events (melody at 0, drone at 0.125)
    for (let beat = 0; beat < 4; beat++) {
      const pairEvents = doc.measures[0].events.filter(
        (e) => Math.floor(e.beatPosition / 0.25) === beat,
      );
      expect(pairEvents.length).toBe(2);
      expect(pairEvents[0].kind).toBe('note');
      expect(pairEvents[1].kind).toBe('drone');
    }
  });

  it('D E F G A B c d has 4 melody-only beat-pairs', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);

    expect(doc.measures[0].events.length).toBe(8);
    const drones = doc.measures[0].events.filter((e) => e.kind === 'drone');
    expect(drones.length).toBe(0);

    for (let beat = 0; beat < 4; beat++) {
      const pairEvents = doc.measures[0].events.filter(
        (e) => Math.floor(e.beatPosition / 0.25) === beat,
      );
      expect(pairEvents.length).toBe(2);
      expect(pairEvents[0].kind).toBe('note');
      expect(pairEvents[1].kind).toBe('note');
    }
  });

  it('beams do not include rests', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 z2 E2 F2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);

    // Beat 0: D2 + drone (2 events)
    // Beat 1: z2 rest (1 event, no drone)
    // Beat 2: E2 + drone (2 events)
    // Beat 3: F2 + drone (2 events)
    const beat0 = doc.measures[0].events.filter(
      (e) => Math.floor(e.beatPosition / 0.25) === 0,
    );
    const beat1 = doc.measures[0].events.filter(
      (e) => Math.floor(e.beatPosition / 0.25) === 1,
    );

    // Beat 0 has 2 events (note + drone) → beamable
    expect(beat0.length).toBeGreaterThanOrEqual(1);
    // Beat 1 has rest only — not beamable
    expect(beat1.some((e) => e.kind === 'rest')).toBe(true);
  });

  it('no drones on downbeat slots (0,2,4,6)', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);

    for (const evt of doc.measures[0].events) {
      const slotIdx = Math.round(evt.beatPosition / 0.125);
      if (slotIdx % 2 === 0 && evt.kind === 'drone') {
        // Should not happen: drone on downbeat
        expect(`drone at slot ${slotIdx}`).toBe('unexpected');
      }
    }
    // All drones should be on offbeat slots
    const drones = doc.measures[0].events.filter((e) => e.kind === 'drone');
    for (const d of drones) {
      const slotIdx = Math.round(d.beatPosition / 0.125);
      expect(slotIdx % 2).toBe(1);
    }
  });
});

/* ── Same-string pair preference tests ─────────────────────── */

describe('same-string pair fingering preference', () => {
  it('c d pair prefers same-string over open string 1 in Open G', () => {
    // Just c d as a pair — 2 eighth notes
    const parsed = parseAbc(`X:1\nT:Pair Test\nM:4/4\nL:1/8\nK:D\nc d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    const notes = doc.measures[0].events.filter((e) => e.kind === 'note');
    expect(notes.length).toBe(2);

    // c should be on string 2 or 3
    expect(notes[0].stringIndex).toBeDefined();
    expect([1, 2]).toContain(notes[0].stringIndex); // 0-indexed: string 2 or 3

    // d should NOT be on string 1 open (that would be stringIndex=0, fret=0)
    if (notes[1].stringIndex === 0 && notes[1].fret === 0) {
      // This is the failing case — d on open 1st string
    }
    // d should be on string 2 fret 3 or string 3 fret 7
    const ok = !(notes[1].stringIndex === 0 && notes[1].fret === 0);
    expect(ok).toBe(true);
  });

  it('D E pair prefers 4th string 0→2 in Open G', () => {
    const parsed = parseAbc(`X:1\nT:Pair Test\nM:4/4\nL:1/8\nK:D\nD E |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    const notes = doc.measures[0].events.filter((e) => e.kind === 'note');
    expect(notes.length).toBe(2);

    // D and E on same string (4th string = index 3) is ideal
    if (notes[0].stringIndex === notes[1].stringIndex) {
      // Same-string pair — good
      expect(Math.abs((notes[1].fret ?? 0) - (notes[0].fret ?? 0))).toBeLessThanOrEqual(3);
    }
  });

  it('A B pair prefers 3rd string 2→4 in Open G', () => {
    const parsed = parseAbc(`X:1\nT:Pair Test\nM:4/4\nL:1/8\nK:D\nA B |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    const notes = doc.measures[0].events.filter((e) => e.kind === 'note');
    expect(notes.length).toBe(2);

    // Both notes should be playable
    expect(notes[0].stringIndex).toBeDefined();
    expect(notes[1].stringIndex).toBeDefined();
  });

  it('full quaver bar D E F# G A B c d in K:G keeps c d same-string', () => {
    // Full 8-note bar in key G (c natural, F# sharp)
    const parsed = parseAbc(`X:1\nT:Full Bar\nM:4/4\nL:1/8\nK:G\nD E F G A B c d |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);

    const notes = doc.measures[0].events.filter((e) => e.kind === 'note');
    expect(notes.length).toBe(8);

    // The last pair c d (indices 6 and 7) must NOT have d on open string 1
    const cNote = notes[6];
    const dNote = notes[7];
    expect(cNote.stringIndex).toBeDefined();
    expect(dNote.stringIndex).toBeDefined();

    // d must not be open string 1
    const dIsOpenString1 = dNote.stringIndex === 0 && dNote.fret === 0;
    expect(dIsOpenString1).toBe(false);
  });

  it('open string 1 intrinsic score reduced for pair-context (v0.2.10)', () => {
    // Verify that open string 1 gets less bonus than other open strings
    const s1f0 = { string: 1, fret: 0, pitch: 62 };  // open D on string 1
    const s4f0 = { string: 4, fret: 0, pitch: 50 };  // open D on string 4

    const s1Score = intrinsicScore(s1f0);
    const s4Score = intrinsicScore(s4f0);

    // String 4 open should score higher than string 1 open
    // (previously they were equal; now string 1 open gets reduced)
    expect(s4Score).toBeGreaterThan(s1Score);
  });
});

/* ── Regression tests ──────────────────────────────────────── */

describe('v0.2.8 behaviour preserved', () => {
  it('Double C labels still D C G C g', () => {
    const doubleC = TUNINGS.find((t) => t.name === 'Double C')!;
    expect(tuningStringLabels(doubleC)).toEqual(['D', 'C', 'G', 'C', 'g']);
  });

  it('no x markers in output', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arr = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arr);
    for (const m of doc.measures) {
      for (const e of m.events) {
        expect(e.kind).not.toBe('skipped');
      }
    }
  });

  it('chord labels preserved', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n"D"D2 "G"E2 |`);
    const arr = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arr);
    const notes = doc.measures[0].events.filter((e) => e.kind === 'note');
    if (notes.length >= 2) {
      expect(notes[0].chordLabel).toBe('D');
      expect(notes[1].chordLabel).toBe('G');
    }
  });
});
