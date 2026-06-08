/** Tab beaming logic — ClawTrad v0.2.5.
 *
 *  Beaming rules for 4/4 reel-style output:
 *  - Group quavers by beat: [1 &] [2 &] [3 &] [4 &]
 *  - No beams across barlines
 *  - No beams through rests
 *  - Long notes (quarter or longer) are not beamed
 *
 *  These rules are consumed by the SVG renderer to produce
 *  beam groups in the visual tab output.
 */

import type { TabMeasure, TabEvent } from './tabLayoutTypes';
import { buildRhythmGrid, computeBeamGroups, type BeamGroup, type RhythmSlot } from './clawhammerRhythmGrid';

/** A beaming plan for a single measure. */
export interface MeasureBeaming {
  measureIndex: number;
  /** Beam groups: each group connects 2 adjacent slots. */
  beamGroups: BeamGroup[];
  /** The rhythm grid slots for this measure. */
  slots: RhythmSlot[];
}

/**
 * Compute a beaming plan for a TabMeasure.
 * Returns null if the measure has no beamable content.
 */
export function planMeasureBeaming(measure: TabMeasure): MeasureBeaming | null {
  const grid = buildRhythmGrid(measure.events, measure.index);
  const groups = computeBeamGroups(grid.slots);

  return {
    measureIndex: measure.index,
    beamGroups: groups,
    slots: grid.slots,
  };
}

/**
 * Check whether a TabEvent should be beamed (short, sounded, non-drone).
 */
export function isBeamable(evt: TabEvent): boolean {
  return (
    evt.duration <= 0.25 &&
    evt.duration > 0 &&
    evt.kind === 'note' &&
    evt.fret !== undefined
  );
}

/**
 * Determine display duration category for an event.
 */
export type DisplayDuration = 'quarter' | 'eighth' | 'sixteenth';

export function displayDuration(evt: TabEvent): DisplayDuration {
  if (evt.duration >= 0.5) return 'quarter';
  if (evt.duration >= 0.25) return 'quarter';
  if (evt.duration <= 0.0625) return 'sixteenth';
  return 'eighth';
}
