/** Beam primitive calculator — ClawTrad v0.2.12.
 *
 *  Pure functions that compute explicit beam rectangles from
 *  positioned tab events.  These are consumed by the SVG
 *  renderer to produce visible beam elements.
 *
 *  Beaming rules:
 *  - Beat pairs: [downbeat, offbeat] within each beat.
 *  - Both slots must be sounded short notes.
 *  - Not both drones.
 *  - No beams across barlines.
 *  - No beams through rests.
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

/* ── Layout constants (mirrored from VisualTab) ────────────── */

const STRING_SPACING = 24;
const STEM_BELOW = 10;
const MIN_STEM = 16;

/**
 * Compute y-coordinate for a beam (bottom of stems).
 * `tabTop` is the y of the top string line in the system.
 */
export function beamY(tabTop: number): number {
  return tabTop + STRING_SPACING * 4 + STEM_BELOW + MIN_STEM;
}

/* ── Main calculator ───────────────────────────────────────── */

/**
 * Compute beam primitives from a flat array of positioned events.
 *
 * @param events   Positioned events for one or more measures.
 * @param tabTop   Y-coordinate of the top string line.
 * @param leftMargin  Left margin offset for x positions.
 * @returns         Array of BeamPrimitive objects.
 */
export function computeBeamPrimitives(
  events: PositionedEvent[],
  tabTop: number,
  leftMargin: number = 50,
): BeamPrimitive[] {
  if (events.length === 0) return [];

  const beams: BeamPrimitive[] = [];
  const beamYPos = beamY(tabTop);
  const beats = Math.max(1, Math.ceil(
    Math.max(...events.map((e) => e.beatPosition ?? 0)) / 0.25,
  ));

  // Group by beat
  const groups: PositionedEvent[][] = Array.from({ length: beats }, () => []);
  for (const evt of events) {
    const b = Math.min(
      Math.floor((evt.beatPosition ?? 0) / 0.25),
      beats - 1,
    );
    groups[b].push(evt);
  }

  for (let beat = 0; beat < beats; beat++) {
    const g = groups[beat];

    if (
      g.length === 2 &&
      isShort(g[0]) && isShort(g[1]) &&
      !(g[0].kind === 'drone' && g[1].kind === 'drone')
    ) {
      const ax = leftMargin + g[0].x;
      const bx = leftMargin + g[1].x;
      const x = Math.min(ax, bx);
      const w = Math.abs(bx - ax);
      const beamH = 6;

      if (w > 0 && ax > 0 && bx > 0) {
        beams.push({
          measureIndex: 0,  // caller can override
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

  return beams;
}

function isShort(evt: PositionedEvent): boolean {
  return (
    (evt.kind === 'note' || evt.kind === 'drone') &&
    (evt.duration ?? 0) > 0 &&
    (evt.duration ?? 0) <= 0.25
  );
}
