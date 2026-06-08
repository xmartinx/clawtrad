/** Melody-to-tab arrangement engine.
 *
 *  v0.1.1: Uses dynamic-programming global-path optimisation instead
 *  of the original greedy selection. The DP finds the minimum-cost
 *  (string, fret) sequence across the entire melody, producing smoother
 *  and more playable fingerings.
 *
 *  Takes a parsed ABC tune and a tuning, and produces a sequence of
 *  (string, fret) positions optimised for playability.
 */

import type { ParsedAbcTune } from '../abc/types';
import type { Tuning } from '../banjo/tunings';
import { findPositions } from '../banjo/fretboard';
import type { TabArrangement, TabColumn, TabCell, OutputMode } from '../banjo/tabTypes';
import { findOptimalPath } from './scoring';
import { addBasicClawhammerDrones } from './clawhammer';

/**
 * Generate a tab arrangement from a parsed ABC tune using global
 * dynamic-programming position selection.
 */
export function arrangeMelody(
  tune: ParsedAbcTune,
  tuning: Tuning,
  mode: OutputMode,
): TabArrangement {
  const warnings: string[] = [...tune.warnings];
  let unplayableCount = 0;

  // ── build candidate groups ────────────────────────────────
  const candidateGroups = tune.notes.map((note) =>
    findPositions(note.pitch, tuning),
  );

  // ── diagnostics ───────────────────────────────────────────
  for (let i = 0; i < candidateGroups.length; i++) {
    if (candidateGroups[i].length === 0) {
      unplayableCount++;
      const note = tune.notes[i];
      warnings.push(
        `Note ${note.raw} (MIDI ${note.pitch}) has no playable position ` +
        `within 0–7 frets in ${tuning.name}. Skipped.`,
      );
    }
  }

  // ── DP global optimisation ────────────────────────────────
  const dpResult = findOptimalPath(candidateGroups);

  // ── build columns ─────────────────────────────────────────
  const columns: TabColumn[] = [];

  for (let i = 0; i < tune.notes.length; i++) {
    const note = tune.notes[i];
    const best = dpResult.path[i];

    if (!best || dpResult.unplayableIndices.includes(i)) {
      columns.push(makeRestColumn(note.duration));
    } else {
      columns.push({
        cells: makeCells(best),
        duration: note.duration,
        hasDrone: false,
        isRest: false,
      });
    }
  }

  let result: TabArrangement = {
    title: tune.title,
    tuning: tuning.name,
    mode,
    columns,
    warnings,
  };

  // ── clawhammer layer ──────────────────────────────────────
  if (mode === 'basic-clawhammer') {
    result = addBasicClawhammerDrones(result);
  }

  return result;
}

/**
 * Create the 5 tab cells for a given position, with all other strings
 * marked as unused (-1).
 */
function makeCells(pos: { string: number; fret: number }): TabCell[] {
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
