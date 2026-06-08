/** Melody-to-tab arrangement engine.
 *
 *  Takes a parsed ABC tune and a tuning, and produces a sequence of
 *  (string, fret) positions optimised for playability.
 */

import type { ParsedAbcTune } from '../abc/types';
import type { Tuning } from '../banjo/tunings';
import type { FretPosition } from '../banjo/fretboard';
import { findPositions } from '../banjo/fretboard';
import type { TabArrangement, TabColumn, TabCell, OutputMode } from '../banjo/tabTypes';
import { selectBestPosition } from './scoring';
import { addBasicClawhammerDrones } from './clawhammer';

/**
 * Generate a melody-only tab arrangement from a parsed ABC tune.
 */
export function arrangeMelody(
  tune: ParsedAbcTune,
  tuning: Tuning,
  mode: OutputMode,
): TabArrangement {
  const warnings: string[] = [...tune.warnings];
  const columns: TabColumn[] = [];
  let prev: FretPosition | null = null;

  for (const note of tune.notes) {
    const candidates = findPositions(note.pitch, tuning);

    if (candidates.length === 0) {
      // Note cannot be played within 0–7 frets in this tuning.
      warnings.push(
        `Note ${note.raw} (MIDI ${note.pitch}) has no playable position ` +
        `within 0–7 frets in ${tuning.name}. Skipped.`,
      );
      // Insert a rest column
      columns.push(makeRestColumn(note.duration));
      continue;
    }

    const best = selectBestPosition(candidates, prev);

    if (!best) {
      columns.push(makeRestColumn(note.duration));
      continue;
    }

    columns.push({
      cells: makeCells(best),
      duration: note.duration,
      hasDrone: false,
      isRest: false,
    });

    prev = best;
  }

  let result: TabArrangement = {
    title: tune.title,
    tuning: tuning.name,
    mode,
    columns,
    warnings,
  };

  // Apply clawhammer treatment if requested
  if (mode === 'basic-clawhammer') {
    result = addBasicClawhammerDrones(result);
  }

  return result;
}

/**
 * Create the 5 tab cells for a given position, with all other strings
 * marked as unused (-1).
 */
function makeCells(pos: FretPosition): TabCell[] {
  const cells: TabCell[] = [];
  for (let s = 1; s <= 5; s++) {
    cells.push({
      string: s,
      fret: s === pos.string ? pos.fret : -1,
    });
  }
  return cells;
}

function makeRestColumn(duration: number): TabColumn {
  return {
    cells: [1, 2, 3, 4, 5].map((s) => ({ string: s, fret: -1 })),
    duration,
    hasDrone: false,
    isRest: true,
  };
}
