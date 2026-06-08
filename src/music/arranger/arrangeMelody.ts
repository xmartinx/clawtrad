/** Melody-to-tab arrangement engine — v0.2.4.
 *
 *  Uses dynamic-programming global-path optimisation.
 *
 *  v0.2.4: For each note, generates candidates at both the original
 *  pitch and one octave lower (pitch − 12).  The DP selects whichever
 *  produces a better banjo placement.  A diagnostic warning is emitted
 *  when the lower octave was preferred.
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
  let octaveLowerUsed = false;

  // ── build candidate groups (original + octave-lower) ───────
  const candidateGroups: FretPosition[][] = [];

  for (const note of tune.notes) {
    const original = findPositions(note.pitch, tuning);
    const lower = findPositions(note.pitch - 12, tuning);

    if (original.length === 0 && lower.length === 0) {
      candidateGroups.push([]);
      unplayableCount++;
      warnings.push(
        `Note ${note.raw} (MIDI ${note.pitch}) has no playable position ` +
        `within frets 0–10 in ${tuning.name}. Skipped.`,
      );
      continue;
    }

    // Mark lower-octave candidates so scoring can prefer them
    const lowerMarked = lower.map((p) => ({
      ...p,
      originalPitch: note.pitch,
    }));

    // Combine: original first (bias towards original), then lower
    candidateGroups.push([...original, ...lowerMarked]);
  }

  // Check after DP if octave-lower was chosen
  const dpResult = findOptimalPath(candidateGroups);

  for (const pos of dpResult.path) {
    if (pos?.originalPitch !== undefined && pos.pitch < pos.originalPitch) {
      octaveLowerUsed = true;
    }
  }

  if (octaveLowerUsed) {
    warnings.push(
      'Melody placed one octave lower for banjo range. ' +
      'Fret positions may differ from the original pitch.',
    );
  }

  // ── build columns ──────────────────────────────────────────
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
