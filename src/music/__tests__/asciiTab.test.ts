import { describe, it, expect } from 'vitest';
import { renderAsciiTab } from '../render/asciiTab';
import type { TabArrangement } from '../banjo/tabTypes';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

function makeSimpleArrangement(): TabArrangement {
  return {
    title: 'Test Tune',
    tuning: 'Open G',
    mode: 'melody-only',
    columns: [
      {
        cells: [
          { string: 1, fret: 0 },   // D4 open
          { string: 2, fret: -1 },
          { string: 3, fret: -1 },
          { string: 4, fret: -1 },
          { string: 5, fret: -1 },
        ],
        duration: 0.125,
        hasDrone: false,
        isRest: false,
      },
      {
        cells: [
          { string: 1, fret: -1 },
          { string: 2, fret: 2 },   // C#4 on string 2
          { string: 3, fret: -1 },
          { string: 4, fret: -1 },
          { string: 5, fret: -1 },
        ],
        duration: 0.125,
        hasDrone: false,
        isRest: false,
      },
      {
        cells: [
          { string: 1, fret: -1 },
          { string: 2, fret: -1 },
          { string: 3, fret: 0 },   // G3 open
          { string: 4, fret: -1 },
          { string: 5, fret: -1 },
        ],
        duration: 0.125,
        hasDrone: false,
        isRest: false,
      },
    ],
    warnings: [],
  };
}

describe('ASCII tab rendering', () => {
  it('produces a non-empty string', () => {
    const arr = makeSimpleArrangement();
    const output = renderAsciiTab(arr, openG);
    expect(output).toBeTruthy();
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes the tune title', () => {
    const arr = makeSimpleArrangement();
    const output = renderAsciiTab(arr, openG);
    expect(output).toContain('Test Tune');
  });

  it('includes the tuning name', () => {
    const arr = makeSimpleArrangement();
    const output = renderAsciiTab(arr, openG);
    expect(output).toContain('Open G');
  });

  it('includes string labels', () => {
    const arr = makeSimpleArrangement();
    const output = renderAsciiTab(arr, openG);
    expect(output).toContain('D'); // String 1 label
    expect(output).toContain('B'); // String 2 label
    expect(output).toContain('G'); // String 3 label
  });

  it('renders fret numbers for played notes', () => {
    const arr = makeSimpleArrangement();
    const output = renderAsciiTab(arr, openG);
    // Should contain fret numbers 0, 2, 0
    expect(output).toContain('-0--');
  });

  it('handles empty arrangements', () => {
    const empty: TabArrangement = {
      title: 'Empty',
      tuning: 'Open G',
      mode: 'melody-only',
      columns: [],
      warnings: [],
    };
    const output = renderAsciiTab(empty, openG);
    expect(output).toContain('(no notes to render)');
  });

  it('includes warnings section when warnings exist', () => {
    const arr = makeSimpleArrangement();
    arr.warnings = ['Test warning message'];
    const output = renderAsciiTab(arr, openG);
    expect(output).toContain('Test warning message');
    expect(output).toContain('Warnings');
  });
});
