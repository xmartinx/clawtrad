/** ASCII tab rendering for ClawTrad v0.1.
 *
 *  Produces a plain-text 5-string banjo tab in a familiar format:
 *
 *     D|---|---|---|---|---|---|---|---|
 *     B|---|---|---|---|---|---|---|---|
 *     G|---|---|---|---|---|---|---|---|
 *     D|---|---|---|---|---|---|---|---|
 *     G|---|---|---|---|---|---|---|---|
 *       0   0   2   0   4   5   0   4
 *
 *  This is intentionally simple text output. Fancy rendering
 *  (SVG, HTML canvas, PDF) is deferred to v0.2.
 */

import type { TabArrangement } from '../banjo/tabTypes';
import { midiToName } from '../theory/notes';
import type { Tuning } from '../banjo/tunings';

/** Maximum columns per line before wrapping. */
const MAX_COLS_PER_LINE = 16;

/**
 * Render a TabArrangement to a plain-text ASCII tab string.
 */
export function renderAsciiTab(
  arrangement: TabArrangement,
  tuning: Tuning,
): string {
  const lines: string[] = [];

  // Title line
  lines.push(`${arrangement.title} — ${tuning.name} (${tuning.notation})`);
  lines.push(`Mode: ${arrangement.mode === 'melody-only' ? 'Melody only' : 'Basic clawhammer'}`);
  lines.push('');

  if (arrangement.columns.length === 0) {
    lines.push('(no notes to render)');
    return lines.join('\n');
  }

  // Split into lines of MAX_COLS_PER_LINE columns
  for (let lineStart = 0; lineStart < arrangement.columns.length; lineStart += MAX_COLS_PER_LINE) {
    const slice = arrangement.columns.slice(lineStart, lineStart + MAX_COLS_PER_LINE);

    // Build string-label lines
    const stringNames = tuning.openPitches.map((p) => {
      const name = midiToName(p);
      // Just the letter part
      return name.replace(/\d+/, '');
    });

    // string 1 = top line, string 5 = bottom line
    // But in tab, we list string 1 (highest, closest to floor) at top
    // Which is index 0 in openPitches
    for (let s = 0; s < 5; s++) {
      const label = stringNames[s].padEnd(2);
      let row = `${label}|`;

      for (const col of slice) {
        const cell = col.cells[s];
        if (cell.fret >= 0) {
          row += `-${cell.fret}--`;
        } else {
          row += '---';
        }
        row += '|';
      }

      // Add drone marker on 5th string
      if (s === 4) {
        // Check for drone markers
        let droneRow = '  ';
        for (const col of slice) {
          droneRow += col.hasDrone ? ' d  ' : '    ';
        }
        lines.push(row);
        lines.push(droneRow);
      } else {
        lines.push(row);
      }
    }

    // Fret numbers row (shows fret for the played string at each column)
    let fretRow = '  ';
    for (const col of slice) {
      if (col.isRest) {
        fretRow += ' -  ';
      } else {
        const played = col.cells.find((c) => c.fret >= 0 && c.string !== 5);
        if (played) {
          fretRow += ` ${played.fret} `.padEnd(4);
        } else {
          fretRow += '    ';
        }
      }
    }
    lines.push(fretRow);
    lines.push('');
  }

  // Warnings
  if (arrangement.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of arrangement.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
  }

  return lines.join('\n');
}

// Re-rexport for convenience
export { midiToName };
