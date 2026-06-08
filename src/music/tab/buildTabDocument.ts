/** Tab document builder for ClawTrad v0.2.8.
 *
 *  Walks arrangement columns and rhythm events in lockstep.
 *  Rests from the parser become rest TabEvents.  Drone columns
 *  from clawhammer fill are correctly emitted.  Unplayable notes
 *  are tracked.
 */

import type { ParsedAbcTune } from '../abc/types';
import type { TabArrangement } from '../banjo/tabTypes';
import type { TabDocument, TabMeasure, TabEvent, TabDiagnostics } from './tabLayoutTypes';
import { TUNINGS } from '../banjo/tunings';

export function buildTabDocument(
  tune: ParsedAbcTune,
  arrangement: TabArrangement,
): TabDocument {
  // ── pre-compute measure slot boundaries ────────────────────
  const measureSlots: number[] = [];
  let cur = 0;
  for (const evt of tune.rhythmEvents) {
    if (evt.kind === 'barline') { if (cur > 0) { measureSlots.push(cur); cur = 0; } }
    else { cur += Math.round(evt.duration / 0.125); }
  }
  if (cur > 0) measureSlots.push(cur);

  // ── chord labels from note rhythm events ───────────────────
  const chordLabels = tune.rhythmEvents
    .filter((e) => e.kind === 'note' && e.chordLabel)
    .map((e) => e.chordLabel!);

  // ── walk columns and rhythm events in lockstep ─────────────
  const measures: TabMeasure[] = [];
  let currentMeasure: TabEvent[] = [];
  let mi = 0;
  let bp = 0;
  let slotsInMeasure = 0;
  let slotTarget = measureSlots.length > 0 ? measureSlots[0] : Infinity;
  let colIdx = 0;
  let reIdx = 0;               // index into non-barline rhythm events
  let melodyIdx = 0;
  let restCount = 0;
  let noteCount = 0;
  let unplayableCount = 0;
  const cols = arrangement.columns;

  while (colIdx < cols.length || reIdx < tune.rhythmEvents.length) {
    // Check barline in rhythm events
    if (reIdx < tune.rhythmEvents.length && tune.rhythmEvents[reIdx].kind === 'barline') {
      reIdx++;
      // Finish measure if we have content at a barline boundary
      if (currentMeasure.length > 0 && slotsInMeasure >= slotTarget) {
        measures.push({ index: mi, events: currentMeasure });
        mi++; currentMeasure = []; bp = 0; slotsInMeasure = 0;
        slotTarget = mi < measureSlots.length ? measureSlots[mi] : Infinity;
      }
      continue;
    }

    // Rhythm rest — emit rest event
    if (reIdx < tune.rhythmEvents.length && tune.rhythmEvents[reIdx].kind === 'rest') {
      const revt = tune.rhythmEvents[reIdx];
      currentMeasure.push({
        kind: 'rest', duration: revt.duration, beatPosition: bp, label: 'z',
      });
      restCount++;
      bp += revt.duration;
      slotsInMeasure += Math.round(revt.duration / 0.125);
      reIdx++;
      continue;
    }

    // Check measure boundary
    if (currentMeasure.length > 0 && slotTarget > 0 && slotsInMeasure >= slotTarget) {
      measures.push({ index: mi, events: currentMeasure });
      mi++; currentMeasure = []; bp = 0; slotsInMeasure = 0;
      slotTarget = mi < measureSlots.length ? measureSlots[mi] : Infinity;
      continue;
    }

    // Rhythm note — consume from arrangement columns
    if (reIdx < tune.rhythmEvents.length && tune.rhythmEvents[reIdx].kind === 'note') {
      const revt = tune.rhythmEvents[reIdx];
      // In clawhammer mode (drone columns present), a note spans
      // multiple arrangement columns (melody + drones).  Otherwise,
      // one column = one note regardless of duration.
      const hasDrones = cols.some((c) => c.hasDrone);
      const colsToConsume = hasDrones
        ? Math.round(revt.duration / 0.125)
        : 1;

      for (let s = 0; s < colsToConsume && colIdx < cols.length; s++) {
        const col = cols[colIdx];

        if (col.isRest) {
          currentMeasure.push({
            kind: 'rest', duration: 0.125, beatPosition: bp, label: 'z',
          });
          restCount++;
          unplayableCount++;
          bp += 0.125;
          slotsInMeasure++;
          colIdx++;
          continue;
        }

        if (col.hasDrone) {
          currentMeasure.push({
            kind: 'drone', duration: 0.125, beatPosition: bp,
            stringIndex: 4, fret: 0,
          });
          bp += 0.125;
          slotsInMeasure++;
          colIdx++;
          continue;
        }

        // Melody column
        const played = col.cells.find((c) => c.fret >= 0 && c.string !== 5)
          ?? col.cells.find((c) => c.fret >= 0);
        const chord = s === 0 && melodyIdx < chordLabels.length
          ? chordLabels[melodyIdx] : undefined;

        currentMeasure.push({
          kind: 'note', duration: col.duration, beatPosition: bp,
          stringIndex: played ? played.string - 1 : undefined,
          fret: played?.fret, chordLabel: chord,
        });
        noteCount++;
        if (s === 0) melodyIdx++;
        bp += col.duration;
        slotsInMeasure += Math.round(col.duration / 0.125);
        colIdx++;
      }

      reIdx++;
      continue;
    }

    // No more rhythm events or columns — break
    break;
  }

  // Final measure
  if (currentMeasure.length > 0) {
    measures.push({ index: mi, events: currentMeasure });
  }

  const diagnostics: TabDiagnostics = {
    noteCount, restCount, unplayableCount, measureCount: measures.length,
  };

  const tuningMeta = TUNINGS.find((t) => t.notation === arrangement.tuning);
  const tuningLabel = tuningMeta?.name ?? arrangement.tuning;

  return {
    title: tune.title, key: tune.keySignature, meter: tune.meter,
    tuningId: arrangement.tuning, tuningLabel,
    mode: arrangement.mode, measures,
    warnings: arrangement.warnings, diagnostics,
  };
}
