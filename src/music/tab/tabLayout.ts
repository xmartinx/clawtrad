/** Tab layout calculator for ClawTrad v0.2.1.
 *
 *  Pure functions that compute a multi-system layout from a TabDocument.
 *  When total tab width exceeds `maxWidth` px, measures wrap into
 *  multiple systems (rows), each with its own set of 5 string lines.
 *
 *  This module has no React dependency and is fully testable.
 */

import type { TabDocument, TabMeasure, TabEvent } from './tabLayoutTypes';

/* ── Constants (shared with VisualTab) ─────────────────────── */

export const LAYOUT = {
  STRING_SPACING: 22,       // px between string lines
  LEFT_MARGIN: 36,          // px for string labels
  SYSTEM_TOP_MARGIN: 20,    // px gap between systems
  MEASURE_GAP: 10,          // px gap between measures within a system
  MEASURE_PAD_LEFT: 8,      // px padding after left barline
  MEASURE_PAD_RIGHT: 12,    // px padding before right barline
  COL_WIDTH: 24,            // px per 1/8-note duration unit
  MIN_EVENT_WIDTH: 12,      // minimum px width for any event
  SYSTEM_HEIGHT: 22 * 4 + 12,  // STRING_SPACING * 4 + bottom pad
  MAX_WIDTH: 780,           // default max px width before wrapping
} as const;

/* ── Types ─────────────────────────────────────────────────── */

/** Event with its computed x position within a system. */
export interface PositionedEvent extends TabEvent {
  x: number;  // centre x within the system
}

/** One system (row) of tab layout. */
export interface TabSystem {
  /** Zero-based system index. */
  index: number;
  /** Indices of measures included in this system. */
  measureIndices: number[];
  /** 1-based measure number of the first measure in this system. */
  startMeasureNumber: number;
  /** All events in this system with computed x positions. */
  events: PositionedEvent[];
  /** x positions of barlines within the system (relative to LEFT_MARGIN). */
  barlines: number[];
  /** Total content width of this system (excluding margins). */
  contentWidth: number;
}

/** Complete multi-system layout. */
export interface SystemLayout {
  systems: TabSystem[];
  /** Maximum content width across all systems. */
  maxContentWidth: number;
  /** Number of systems. */
  systemCount: number;
  /** Time signature string (e.g. "4/4") from the document. */
  timeSignature: string;
}

/* ── Layout computation ────────────────────────────────────── */

/**
 * Compute a multi-system tab layout from a TabDocument.
 *
 * Measures wrap to a new system when the cumulative width would
 * exceed `maxWidth`.  Measures are kept whole unless a single
 * measure is wider than `maxWidth` (in which case it overflows
 * rather than being split — this matches the "unless unavoidable"
 * design constraint).
 */
export function computeLayout(
  doc: TabDocument,
  maxWidth: number = LAYOUT.MAX_WIDTH,
): SystemLayout {
  const systems: TabSystem[] = [];
  let systemIndex = 0;
  let currentMeasureIndices: number[] = [];
  let currentEvents: PositionedEvent[] = [];
  let currentBarlines: number[] = [];
  let currentX = 0; // cumulative x within the current system
  let maxContentWidth = 0;

  for (let mi = 0; mi < doc.measures.length; mi++) {
    const measure = doc.measures[mi];
    const measureWidth = computeMeasureWidth(measure);
    const needsBarline = currentMeasureIndices.length > 0;
    const additionalWidth = (needsBarline ? LAYOUT.MEASURE_GAP : 0) + measureWidth;

    // Check if we need to wrap to a new system
    if (currentMeasureIndices.length > 0 && currentX + additionalWidth > maxWidth) {
      // Finish current system
      systems.push(finishSystem(systemIndex, currentMeasureIndices, currentEvents, currentBarlines, currentX));
      maxContentWidth = Math.max(maxContentWidth, currentX);
      systemIndex++;
      currentMeasureIndices = [];
      currentEvents = [];
      currentBarlines = [];
      currentX = 0;
    }

    // Start a new measure in the current system
    if (currentMeasureIndices.length > 0) {
      currentBarlines.push(currentX);
      currentX += LAYOUT.MEASURE_GAP;
    }

    currentMeasureIndices.push(mi);

    // Inner measure padding after left barline
    currentX += LAYOUT.MEASURE_PAD_LEFT;

    // Position events within this measure
    for (const evt of measure.events) {
      const w = eventWidth(evt);
      const cx = currentX + w / 2;
      currentEvents.push({ ...evt, x: cx });
      currentX += w;
    }

    // Inner measure padding before right barline (larger for breathing room)
    currentX += LAYOUT.MEASURE_PAD_RIGHT;
  }

  // Finish the final system
  if (currentMeasureIndices.length > 0) {
    systems.push(finishSystem(systemIndex, currentMeasureIndices, currentEvents, currentBarlines, currentX));
    maxContentWidth = Math.max(maxContentWidth, currentX);
  }

  return {
    systems,
    maxContentWidth,
    systemCount: systems.length,
    timeSignature: doc.meter,
  };
}

/* ── Helpers ───────────────────────────────────────────────── */

function computeMeasureWidth(measure: TabMeasure): number {
  return measure.events.reduce((w, evt) => w + eventWidth(evt), 0)
    + LAYOUT.MEASURE_PAD_LEFT + LAYOUT.MEASURE_PAD_RIGHT;
}

function eventWidth(evt: TabEvent): number {
  return Math.max(evt.duration * LAYOUT.COL_WIDTH * 8, LAYOUT.MIN_EVENT_WIDTH);
}

function finishSystem(
  index: number,
  measureIndices: number[],
  events: PositionedEvent[],
  barlines: number[],
  contentWidth: number,
): TabSystem {
  return {
    index,
    measureIndices,
    startMeasureNumber: measureIndices.length > 0 ? measureIndices[0] + 1 : 1,
    events,
    barlines,
    contentWidth,
  };
}
