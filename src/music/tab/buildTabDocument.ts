/** Tab document builder for ClawTrad v0.2.
 *
 *  Converts a ParsedAbcTune + TabArrangement into a TabDocument
 *  that preserves rhythmic structure (notes, rests, barlines).
 */

import type { ParsedAbcTune } from '../abc/types';
import type { TabArrangement, TabColumn } from '../banjo/tabTypes';
import type { TabDocument, TabMeasure, TabEvent, TabDiagnostics } from './tabLayoutTypes';

/**
 * Build a TabDocument from parsed ABC and the computed arrangement.
 *
 * The arrangement provides the (string, fret) positions for each note.
 * The parser's rhythm events provide the rhythmic skeleton (notes, rests,
 * barlines).  These are interleaved so rests and barlines appear at the
 * correct positions in the output.
 */
export function buildTabDocument(
  tune: ParsedAbcTune,
  arrangement: TabArrangement,
): TabDocument {
  // ── map note rhythm events to arrangement columns ──────────
  const noteEvents = tune.rhythmEvents.filter((e) => e.kind === 'note');
  const noteColumns = arrangement.columns.filter((c) => !c.isRest);

  // Build a lookup from note-event index to arrangement column
  const noteToColumn = new Map<number, TabColumn>();
  for (let i = 0; i < Math.min(noteEvents.length, noteColumns.length); i++) {
    noteToColumn.set(i, noteColumns[i]);
  }

  // ── build measures from rhythm events ──────────────────────
  const measures: TabMeasure[] = [];
  let currentMeasure: TabEvent[] = [];
  let measureIndex = 0;
  let beatPosition = 0;        // cumulative within measure
  let noteIndex = 0;
  let restCount = 0;
  let noteCount = 0;
  let unplayableCount = 0;
  const measureBeatPositions: number[] = []; // beat position at start of each measure

  for (const evt of tune.rhythmEvents) {
    if (evt.kind === 'barline') {
      // Finish current measure
      measures.push({
        index: measureIndex,
        events: currentMeasure,
      });
      measureIndex++;
      currentMeasure = [];
      beatPosition = 0;
      measureBeatPositions.push(beatPosition);
      continue;
    }

    if (evt.kind === 'rest') {
      currentMeasure.push({
        kind: 'rest',
        duration: evt.duration,
        beatPosition,
        label: 'z',
      });
      restCount++;
      beatPosition += evt.duration;
      continue;
    }

    if (evt.kind === 'note') {
      const col = noteToColumn.get(noteIndex);
      noteIndex++;

      if (!col) {
        // Shouldn't happen, but guard
        currentMeasure.push({
          kind: 'skipped',
          duration: evt.duration,
          beatPosition,
          label: 'x',
          sourcePitch: evt.pitch,
        });
        unplayableCount++;
        beatPosition += evt.duration;
        continue;
      }

      if (col.isRest) {
        // Note was unplayable — emit a skipped event
        currentMeasure.push({
          kind: 'skipped',
          duration: evt.duration,
          beatPosition,
          label: 'x',
          sourcePitch: evt.pitch,
          warning: `Note ${evt.raw} unplayable in this tuning`,
        });
        unplayableCount++;
        beatPosition += evt.duration;
        continue;
      }

      // Find the melody string/fret (not the drone)
      const played = col.cells.find(
        (c) => c.fret >= 0 && c.string !== 5,
      ) ?? col.cells.find((c) => c.fret >= 0);

      currentMeasure.push({
        kind: 'note',
        duration: evt.duration,
        beatPosition,
        stringIndex: played ? played.string - 1 : undefined,
        fret: played?.fret,
        sourcePitch: evt.pitch,
        chordLabel: evt.chordLabel,
      });
      noteCount++;

      // If the column also carries a drone, emit a drone
      // event at the same beat position.
      if (col.hasDrone) {
        currentMeasure.push({
          kind: 'drone',
          duration: evt.duration,
          beatPosition,
          stringIndex: 4,   // 5th string
          fret: 0,
        });
      }

      beatPosition += evt.duration;
      continue;
    }
  }

  // Final measure (if not ended by a barline)
  if (currentMeasure.length > 0) {
    measures.push({
      index: measureIndex,
      events: currentMeasure,
    });
  }

  // ── diagnostics ────────────────────────────────────────────
  const diagnostics: TabDiagnostics = {
    noteCount,
    restCount,
    unplayableCount,
    measureCount: measures.length,
  };

  return {
    title: tune.title,
    key: tune.keySignature,
    meter: tune.meter,
    tuningId: arrangement.tuning,
    tuningLabel: arrangement.tuning,
    mode: arrangement.mode,
    measures,
    warnings: arrangement.warnings,
    diagnostics,
  };
}
