/** Beam primitive calculator — ClawTrad v0.2.15.
 *
 *  Pure functions that compute explicit beam rectangles from
 *  positioned tab events.  Beams are per-measure: events are
 *  split at beatPosition resets to handle multi-measure systems.
 */

import type { PositionedEvent } from './tabLayout';

/* ── Types ─────────────────────────────────────────────────── */

export interface BeamPrimitive {
  measureIndex: number;
  systemIndex: number;
  beatIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ── Layout constants ──────────────────────────────────────── */

const STRING_SPACING = 24;
const STEM_BELOW = 10;
const MIN_STEM = 16;

export function beamY(tabTop: number): number {
  return tabTop + STRING_SPACING * 4 + STEM_BELOW + MIN_STEM;
}

/* ── Main calculator ───────────────────────────────────────── */

/**
 * Compute beam primitives from positioned events.
 * Splits events at measure boundaries (beatPosition resets).
 */
export function computeBeamPrimitives(
  events: PositionedEvent[],
  tabTop: number,
  leftMargin: number = 50,
): BeamPrimitive[] {
  if (events.length === 0) return [];

  // Split into per-measure segments at beatPosition resets
  const segments = splitMeasures(events);
  const beams: BeamPrimitive[] = [];
  const beamYPos = beamY(tabTop);
  const beamH = 6;

  for (let mi = 0; mi < segments.length; mi++) {
    const seg = segments[mi];
    if (seg.length === 0) continue;

    const maxBp = Math.max(...seg.map((e) => e.beatPosition ?? 0));
    const beats = Math.max(1, Math.ceil(maxBp / 0.25));

    // Group by beat within this segment
    const groups: PositionedEvent[][] = Array.from({ length: beats }, () => []);
    for (const evt of seg) {
      const b = Math.min(
        Math.floor((evt.beatPosition ?? 0) / 0.25),
        beats - 1,
      );
      groups[b].push(evt);
    }

    for (let beat = 0; beat < beats; beat++) {
      const g = groups[beat];

      // Beam if exactly 2 short events, not both drones
      if (
        g.length === 2 &&
        isShort(g[0]) && isShort(g[1]) &&
        !(g[0].kind === 'drone' && g[1].kind === 'drone')
      ) {
        const ax = leftMargin + g[0].x;
        const bx = leftMargin + g[1].x;
        const x = Math.min(ax, bx);
        const w = Math.abs(bx - ax);

        if (w > 0 && ax > 0 && bx > 0) {
          beams.push({
            measureIndex: mi,
            systemIndex: 0,
            beatIndex: beat,
            x: x - 2,
            y: beamYPos - beamH / 2,
            width: w + 4,
            height: beamH,
          });
        }
      }
    }
  }

  return beams;
}

/**
 * Split a flat event array at measure boundaries.
 * A boundary is detected when beatPosition drops by >0.1
 * (indicating a new measure).
 */
function splitMeasures(events: PositionedEvent[]): PositionedEvent[][] {
  const segments: PositionedEvent[][] = [];
  let cur: PositionedEvent[] = [];
  let prevBp = -1;

  for (const evt of events) {
    const bp = evt.beatPosition ?? 0;
    if (prevBp >= 0 && bp < prevBp - 0.1) {
      // Measure boundary: bp reset
      segments.push(cur);
      cur = [];
    }
    cur.push(evt);
    prevBp = bp;
  }
  if (cur.length > 0) segments.push(cur);

  return segments.length > 0 ? segments : [events];
}

function isShort(evt: PositionedEvent): boolean {
  return (
    (evt.kind === 'note' || evt.kind === 'drone') &&
    (evt.duration ?? 0) > 0 &&
    (evt.duration ?? 0) <= 0.25
  );
}
