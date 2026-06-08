/**
 * Tab layout calculator tests for v0.2.1.
 */
import { describe, it, expect } from 'vitest';
import { computeLayout, LAYOUT } from '../tab/tabLayout';
import type { TabDocument, TabMeasure } from '../tab/tabLayoutTypes';

function makeDoc(measures: TabMeasure[]): TabDocument {
  return {
    title: 'Test',
    key: 'D',
    meter: '4/4',
    tuningId: 'gDGBD',
    tuningLabel: 'Open G',
    mode: 'melody-only',
    measures,
    warnings: [],
    diagnostics: {
      noteCount: measures.reduce((n, m) => n + m.events.filter((e) => e.kind === 'note').length, 0),
      restCount: measures.reduce((n, m) => n + m.events.filter((e) => e.kind === 'rest').length, 0),
      unplayableCount: measures.reduce((n, m) => n + m.events.filter((e) => e.kind === 'skipped').length, 0),
      measureCount: measures.length,
    },
  };
}

function simpleMeasure(index: number, count: number): TabMeasure {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push({
      kind: 'note' as const,
      duration: 0.125,
      beatPosition: i * 0.125,
      stringIndex: 0,
      fret: 0,
    });
  }
  return { index, events };
}

describe('tab layout calculator', () => {
  it('single measure fits in one system', () => {
    const doc = makeDoc([simpleMeasure(0, 4)]);
    const layout = computeLayout(doc);
    expect(layout.systems).toHaveLength(1);
    expect(layout.systemCount).toBe(1);
  });

  it('creates multiple systems for many measures', () => {
    // 40 measures of 8 notes each: each measure ≈ 8 * 24 = 192px wide
    // With 10px gap between measures, ~10 measures fit per 780px system
    const measures = Array.from({ length: 40 }, (_, i) => simpleMeasure(i, 8));
    const doc = makeDoc(measures);
    const layout = computeLayout(doc);
    expect(layout.systemCount).toBeGreaterThan(1);
  });

  it('wraps at specified maxWidth', () => {
    // Each measure: 8 events * 24px = 192px
    // With 320px max, only 1 measure fits per system
    const measures = Array.from({ length: 10 }, (_, i) => simpleMeasure(i, 8));
    const doc = makeDoc(measures);
    const layout = computeLayout(doc, 320);
    // Each measure ≈ 192px, fits 1 per 320px system → 10 systems
    expect(layout.systemCount).toBeGreaterThanOrEqual(5);
  });

  it('preserves measure order across systems', () => {
    const measures = Array.from({ length: 15 }, (_, i) => simpleMeasure(i, 4));
    const doc = makeDoc(measures);
    const layout = computeLayout(doc, 400);

    const allMeasureIndices: number[] = [];
    for (const sys of layout.systems) {
      allMeasureIndices.push(...sys.measureIndices);
    }

    expect(allMeasureIndices).toEqual(measures.map((_, i) => i));
  });

  it('events appear in order within each system', () => {
    const measures = [
      {
        index: 0,
        events: [
          { kind: 'note' as const, duration: 0.125, beatPosition: 0, stringIndex: 0, fret: 0 },
          { kind: 'rest' as const, duration: 0.125, beatPosition: 0.125, label: 'z' },
          { kind: 'note' as const, duration: 0.125, beatPosition: 0.25, stringIndex: 1, fret: 2 },
        ],
      },
    ];
    const doc = makeDoc(measures);
    const layout = computeLayout(doc);
    const kinds = layout.systems[0].events.map((e) => e.kind);
    expect(kinds).toEqual(['note', 'rest', 'note']);
  });

  it('barlines are placed between measures', () => {
    const measures = [simpleMeasure(0, 4), simpleMeasure(1, 4), simpleMeasure(2, 4)];
    const doc = makeDoc(measures);
    const layout = computeLayout(doc, 2000); // wide enough for all in one system

    // 3 measures → 2 barlines (between 0-1 and 1-2)
    expect(layout.systems[0].barlines).toHaveLength(2);
  });

  it('barlines reset for each system', () => {
    const measures = Array.from({ length: 20 }, (_, i) => simpleMeasure(i, 4));
    const doc = makeDoc(measures);
    const layout = computeLayout(doc, 400);

    for (const sys of layout.systems) {
      // Each system with N measures should have N-1 barlines
      expect(sys.barlines).toHaveLength(sys.measureIndices.length - 1);
    }
  });

  it('event x positions increase within each system', () => {
    const measures = Array.from({ length: 5 }, (_, i) => simpleMeasure(i, 4));
    const doc = makeDoc(measures);
    const layout = computeLayout(doc, 2000);

    for (const sys of layout.systems) {
      for (let i = 1; i < sys.events.length; i++) {
        expect(sys.events[i].x).toBeGreaterThan(sys.events[i - 1].x);
      }
    }
  });

  it('wider durations get wider spacing', () => {
    const measure: TabMeasure = {
      index: 0,
      events: [
        { kind: 'note', duration: 0.125, beatPosition: 0, stringIndex: 0, fret: 0 },
        { kind: 'note', duration: 0.25, beatPosition: 0.125, stringIndex: 0, fret: 2 },
        { kind: 'note', duration: 0.5, beatPosition: 0.375, stringIndex: 0, fret: 4 },
      ],
    };
    const doc = makeDoc([measure]);
    const layout = computeLayout(doc);

    // The gap after the half note should be wider than after the eighth note
    const gapAfterEighth = layout.systems[0].events[1].x - layout.systems[0].events[0].x;
    const gapAfterQuarter = layout.systems[0].events[2].x - layout.systems[0].events[1].x;
    // Quarter note (0.25) should have ~2x the width of eighth note (0.125)
    // Each gap = (dur_a/2 + dur_b/2) * COL_WIDTH * 8
    // For eighth then quarter: gap = (0.125/2 + 0.25/2) * 192 = 0.1875 * 192 = 36
    // But the x positions don't measure gaps between centers — they ARE the centers
    // diff between centers of successive events:
    //   = eventWidth(evt_a)/2 + eventWidth(evt_b)/2
    //   = 24/2 + 48/2 = 12 + 24 = 36 for eighth→quarter
    //   = 48/2 + 96/2 = 24 + 48 = 72 for quarter→half
    // In any case, the second gap should be larger
    expect(gapAfterQuarter).toBeGreaterThan(gapAfterEighth);
  });

  it('empty document has zero systems', () => {
    const doc = makeDoc([]);
    const layout = computeLayout(doc);
    expect(layout.systems).toHaveLength(0);
    expect(layout.systemCount).toBe(0);
  });

  it('rest events have x positions', () => {
    const measure: TabMeasure = {
      index: 0,
      events: [
        { kind: 'rest', duration: 0.25, beatPosition: 0, label: 'z' },
        { kind: 'note', duration: 0.25, beatPosition: 0.25, stringIndex: 0, fret: 0 },
      ],
    };
    const doc = makeDoc([measure]);
    const layout = computeLayout(doc);
    expect(layout.systems[0].events).toHaveLength(2);
    expect(layout.systems[0].events[0].x).toBeGreaterThan(0);
    expect(layout.systems[0].events[1].x).toBeGreaterThan(
      layout.systems[0].events[0].x,
    );
  });

  it('skipped events appear in positioned events', () => {
    const measure: TabMeasure = {
      index: 0,
      events: [
        { kind: 'skipped', duration: 0.125, beatPosition: 0, label: '—', sourcePitch: 48 },
        { kind: 'note', duration: 0.125, beatPosition: 0.125, stringIndex: 0, fret: 0 },
      ],
    };
    const doc = makeDoc([measure]);
    const layout = computeLayout(doc);
    const kinds = layout.systems[0].events.map((e) => e.kind);
    expect(kinds).toContain('skipped');
    expect(kinds).toContain('note');
  });

  it('maxContentWidth reflects the widest system', () => {
    // Create measures with different widths; use a wide maxWidth so they all fit
    // into one system, letting us verify maxContentWidth.
    const wideMeasures = Array.from({ length: 2 }, (_, i) => simpleMeasure(i, 16)); // ~384px each
    const narrowMeasures = Array.from({ length: 4 }, (_, i) => simpleMeasure(i, 2)); // ~48px each
    const doc = makeDoc([...wideMeasures, ...narrowMeasures]);
    // Use a generous width so everything fits in one system
    const layout = computeLayout(doc, 2000);

    expect(layout.maxContentWidth).toBeGreaterThan(0);
    // With all measures in one system, maxContentWidth should be ≥ the sum
    // of all measure widths + gaps
    expect(layout.maxContentWidth).toBeGreaterThanOrEqual(
      2 * 16 * LAYOUT.COL_WIDTH,
    );
  });
});
