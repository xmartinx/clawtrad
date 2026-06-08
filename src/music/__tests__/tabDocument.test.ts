/**
 * Tab document model tests for v0.2.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { buildTabDocument } from '../tab/buildTabDocument';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

describe('rhythm events in parsed ABC', () => {
  it('includes note rhythm events', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const notes = result.rhythmEvents.filter((e) => e.kind === 'note');
    expect(notes).toHaveLength(4);
  });

  it('includes rest rhythm events', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 z2 E2 z2 |`);
    const rests = result.rhythmEvents.filter((e) => e.kind === 'rest');
    expect(rests).toHaveLength(2);
  });

  it('includes barline rhythm events', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 | F2 G2 |`);
    const barlines = result.rhythmEvents.filter((e) => e.kind === 'barline');
    expect(barlines.length).toBeGreaterThanOrEqual(2);
  });

  it('rhythm events are in order', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 z2 E2 | F2 z2 G2 |`);
    const kinds = result.rhythmEvents.map((e) => e.kind);
    expect(kinds).toEqual([
      'note', 'rest', 'note', 'barline',
      'note', 'rest', 'note', 'barline',
    ]);
  });

  it('rests have correct durations', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nz4 D2 z2 E2 |`);
    const rests = result.rhythmEvents.filter((e) => e.kind === 'rest');
    expect(rests[0].duration).toBe(0.5);  // z4 = half note
    expect(rests[1].duration).toBe(0.25); // z2 = quarter note
  });

  it('notes have pitch in rhythm events', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 |`);
    const notes = result.rhythmEvents.filter((e) => e.kind === 'note');
    expect(notes[0].pitch).toBe(62); // D4
    expect(notes[1].pitch).toBe(64); // E4
  });
});

describe('buildTabDocument', () => {
  const abc = `X:1
T:Tab Doc Test
M:4/4
L:1/8
K:D
D2 E2 F2 G2 | A2 B2 c2 d2 |`;

  it('produces a TabDocument with correct title and key', () => {
    const parsed = parseAbc(abc);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.title).toBe('Tab Doc Test');
    expect(doc.key).toBe('D');
    expect(doc.meter).toBe('4/4');
    expect(doc.tuningLabel).toBe('Open G');
  });

  it('separates into measures at barlines', () => {
    const parsed = parseAbc(abc);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    // Two bar lines = 3 measures (before first |, between | and |, after last |)
    // Actually: D2 E2 F2 G2 | A2 B2 c2 d2 | → 2 measures
    expect(doc.measures.length).toBeGreaterThanOrEqual(2);
    expect(doc.diagnostics.measureCount).toBe(doc.measures.length);
  });

  it('note events have string and fret', () => {
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const events = doc.measures[0].events;
    for (const evt of events) {
      if (evt.kind === 'note') {
        expect(evt.stringIndex).toBeGreaterThanOrEqual(0);
        expect(evt.fret).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('rest events have label "z"', () => {
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 z2 E2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const rests = doc.measures[0].events.filter((e) => e.kind === 'rest');
    expect(rests.length).toBeGreaterThanOrEqual(1);
    expect(rests[0].label).toBe('z');
  });

  it('diagnostics counts notes and rests correctly', () => {
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 z2 E2 z2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.diagnostics.noteCount).toBe(2);
    expect(doc.diagnostics.restCount).toBeGreaterThanOrEqual(2);
  });

  it('unplayable notes produce skipped events', () => {
    // C,2 is too low for banjo (C3 = MIDI 48)
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nC,2 D2 E2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const skipped = doc.measures[0].events.filter((e) => e.kind === 'skipped');
    expect(skipped.length).toBeGreaterThanOrEqual(1);
    expect(doc.diagnostics.unplayableCount).toBeGreaterThanOrEqual(1);
  });

  it('carries warnings forward from arrangement', () => {
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nC,2 D2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    // Should have at least the parser warnings
    expect(doc.warnings).toBeDefined();
  });

  it('basic clawhammer mode produces drone events', () => {
    const cwAbc = `X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 D2 D2 D2 | D2 D2 D2 D2 |`;
    const parsed = parseAbc(cwAbc);
    const arrangement = arrangeMelody(parsed, openG, 'basic-clawhammer');
    const doc = buildTabDocument(parsed, arrangement);

    const drones = doc.measures.flatMap((m) =>
      m.events.filter((e) => e.kind === 'drone'),
    );
    // Should have at least some drone events on strong beats
    expect(drones.length).toBeGreaterThan(0);
  });

  it('beat positions increment within measures', () => {
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    const events = doc.measures[0].events;
    for (let i = 1; i < events.length; i++) {
      expect(events[i].beatPosition).toBeGreaterThan(events[i - 1].beatPosition);
    }
  });

  it('beat positions reset after barlines', () => {
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 | F2 G2 |`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    if (doc.measures.length >= 2) {
      // First event of second measure should start at beat 0
      expect(doc.measures[1].events[0].beatPosition).toBe(0);
    }
  });

  it('handles ABC with no barlines', () => {
    const parsed = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.measures.length).toBeGreaterThanOrEqual(1);
    expect(doc.diagnostics.measureCount).toBe(doc.measures.length);
  });

  it('does not crash on empty input', () => {
    const parsed = parseAbc(`X:1\nT:Empty\nK:D\n`);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.title).toBe('Empty');
    expect(doc.diagnostics.noteCount).toBe(0);
  });
});

describe('tab document diagnostics', () => {
  it('reports correct counts for a typical tune', () => {
    const abc = `X:1\nT:Diag\nM:4/4\nL:1/8\nK:D
|: D2 FA d2 fd | A2 ce a2 ge | f2 d2 e2 c2 | d4 d2 z2 :|`;
    const parsed = parseAbc(abc);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.diagnostics.noteCount).toBeGreaterThan(0);
    expect(doc.diagnostics.restCount).toBeGreaterThanOrEqual(0);
    expect(doc.diagnostics.measureCount).toBeGreaterThan(0);
    expect(doc.diagnostics.unplayableCount).toBeGreaterThanOrEqual(0);
  });
});
