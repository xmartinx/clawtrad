/** Melody-to-tab arrangement engine — v0.2.5.
 *
 *  Uses dynamic-programming global-path optimisation.
 *
 *  v0.2.5: Each tuning carries a `pitchOffset` that shifts ABC pitches
 *  into the banjo's natural range.  For standard tunings this is −12,
 *  so ABC D4 maps to the 4th-string open D3.  No optional "try both
 *  octaves" — the offset is deterministic per tuning.
 */

import type { ParsedAbcTune } from '../abc/types';
import type { Tuning } from '../banjo/tunings';
import { findPositions, type FretPosition } from '../banjo/fretboard';
import type { TabArrangement, TabColumn, TabCell, OutputMode } from '../banjo/tabTypes';
import { findOptimalPath } from './scoring';
import { addBasicClawhammerDrones } from './clawhammer';

export function arrangeMelody(
  tune: ParsedAbcTune,
  tuning: Tuning,
  mode: OutputMode,
): TabArrangement {
  const warnings: string[] = [...tune.warnings];
  let unplayableCount = 0;

  // ── build candidate groups with per-tuning pitch offset ──────
  const candidateGroups: FretPosition[][] = [];

  for (const note of tune.notes) {
    const banjoPitch = note.pitch + tuning.pitchOffset;
    const candidates = findPositions(banjoPitch, tuning);

    if (candidates.length === 0) {
      candidateGroups.push([]);
      unplayableCount++;
      warnings.push(
        `Note ${note.raw} (ABC MIDI ${note.pitch}, banjo ${banjoPitch}) ` +
        `has no playable position in ${tuning.name}. Skipped.`,
      );
      continue;
    }

    candidateGroups.push(candidates);
  }

  // ── DP global optimisation ──────────────────────────────────
  const dpResult = findOptimalPath(candidateGroups);

  // ── build columns ───────────────────────────────────────────
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
    tuning: tuning.notation,  // canonical ID for downstream lookup
    mode,
    columns,
    warnings,
  };

  if (mode === 'basic-clawhammer') {
    result = addBasicClawhammerDrones(result);
  }

  return result;
}

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
