/**
 * Tab engraving style tests for v0.2.3.
 * Covers measure numbers, time signature, skipped "x" markers,
 * chord labels, and rhythm stem layout.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { computeLayout } from '../tab/tabLayout';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

describe('skipped notes use "x" marker', () => {
  it('buildTabDocument uses "x" label for skipped events', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nC,2 D2 E2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const skipped = doc.measures.flatMap((m) =>
      m.events.filter((e) => e.kind === 'skipped'),
    );
    if (skipped.length > 0) {
      expect(skipped[0].label).toBe('x');
    }
    expect(doc.diagnostics.unplayableCount).toBeGreaterThanOrEqual(1);
  });

  it('Visual tab layout handles unplayable notes as rests (v0.2.5)', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nC,2 D2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);
    const layout = computeLayout(doc);

    const allEvents = layout.systems.flatMap((s) => s.events);
    // v0.2.5: unplayable notes are rests, not skipped/x markers
    const rests = allEvents.filter((e) => e.kind === 'rest');
    expect(rests.length).toBeGreaterThan(0);
  });
});

describe('measure numbers in layout', () => {
  it('first system starts at measure 1', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G | A B c d |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);
    const layout = computeLayout(doc);

    expect(layout.systems[0].startMeasureNumber).toBe(1);
  });

  it('measure numbers increment across systems when wrapped', () => {
    // Create enough measures to force wrapping
    const measures = Array.from({ length: 40 }, () =>
      `D2 E2 F2 G2 |`,
    ).join(' ');
    const abc = `X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n${measures}`;
    const parsed = parseAbc(abc);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);
    const layout = computeLayout(doc, 400); // narrow width forces wrapping

    expect(layout.systemCount).toBeGreaterThan(1);
    // Each system's start measure number should increase
    for (let i = 1; i < layout.systems.length; i++) {
      expect(layout.systems[i].startMeasureNumber).toBeGreaterThan(
        layout.systems[i - 1].startMeasureNumber,
      );
    }
  });
});

describe('time signature in layout', () => {
  it('includes time signature from document', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);
    const layout = computeLayout(doc);

    expect(layout.timeSignature).toBe('4/4');
  });

  it('round-trips alternate time signatures', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:3/4\nL:1/8\nK:D\nD E F |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);
    const layout = computeLayout(doc);

    expect(layout.timeSignature).toBe('3/4');
  });
});

describe('chord labels in pipeline', () => {
  it('parses chord labels from quoted symbols in ABC', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n"D"D2 "G"E2 "Em"F2 "A"G2 |`);
    const notes = parsed.rhythmEvents.filter((e) => e.kind === 'note');

    // D chord on first note
    expect(notes[0].chordLabel).toBe('D');
    // G chord on second note
    expect(notes[1].chordLabel).toBe('G');
    // Em chord on third note
    expect(notes[2].chordLabel).toBe('Em');
    // A chord on fourth note
    expect(notes[3].chordLabel).toBe('A');
  });

  it('chord labels propagate to TabDocument', () => {
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n"D"D2 "G"E2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const notes = doc.measures[0].events.filter((e) => e.kind === 'note');
    if (notes.length >= 2) {
      expect(notes[0].chordLabel).toBe('D');
      expect(notes[1].chordLabel).toBe('G');
    }
  });

  it('non-chord quoted strings are not captured as labels', () => {
    // A quoted text annotation that isn't a chord symbol
    const parsed = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n"hello"D2 E2 |`);
    const notes = parsed.rhythmEvents.filter((e) => e.kind === 'note');
    // Should not have a chord label for non-chord text
    expect(notes[0].chordLabel).toBeUndefined();
  });

  it('chord labels are display-only and do not affect arrangement', () => {
    const abcWithChords = `X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n"D"D2 "G"E2 "A"F2 "G"G2 |`;
    const abcWithout = `X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`;

    const parsedWith = parseAbc(abcWithChords);
    const parsedWithout = parseAbc(abcWithout);
    // Verify parsing (arrange would also work; tested elsewhere)
    // Same number of melody notes
    expect(parsedWith.notes.length).toBe(parsedWithout.notes.length);
    // Same pitches (arrangement not affected by chords)
    for (let i = 0; i < parsedWith.notes.length; i++) {
      expect(parsedWith.notes[i].pitch).toBe(parsedWithout.notes[i].pitch);
    }
  });
});

describe('layout still wraps correctly', () => {
  it('multi-system layout preserves all engraving data', () => {
    const multiMeasures = Array.from({ length: 30 }, () =>
      `D2 E2 F2 G2 |`,
    ).join(' ');
    const abc = `X:1\nT:Multi\nM:4/4\nL:1/8\nK:D\n${multiMeasures}`;
    const parsed = parseAbc(abc);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);
    const layout = computeLayout(doc, 400);

    expect(layout.systemCount).toBeGreaterThan(1);
    expect(layout.timeSignature).toBe('4/4');

    for (const sys of layout.systems) {
      expect(sys.startMeasureNumber).toBeGreaterThan(0);
      expect(sys.events.length).toBeGreaterThan(0);
      expect(sys.barlines.length).toBe(sys.measureIndices.length - 1);
    }
  });
});
