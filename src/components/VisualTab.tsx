/** Visual SVG tab rendering for ClawTrad v0.2.5.
 *
 *  Renders a TabDocument as inline SVG:
 *  - Tuning letter labels at left (not string numbers)
 *  - 5th string (bottom line) drone-only, open "0"
 *  - Beam groups by beat: [1&] [2&] [3&] [4&]
 *  - No x markers in normal output (unplayable→rest)
 *  - Multi-system wrapping with measure numbers, time sig
 */

import React from 'react';
import type { TabDocument } from '../music/tab/tabLayoutTypes';
import { computeLayout, type SystemLayout, type PositionedEvent } from '../music/tab/tabLayout';
import { computeBeamPrimitives } from '../music/tab/beamPrimitives';
import { tuningStringLabels } from '../music/banjo/tunings';
import { TUNINGS } from '../music/banjo/tunings';

/* ── Layout constants ──────────────────────────────────────── */

const STRING_SPACING = 24;
const LEFT_MARGIN = 50;
const HEADER_HEIGHT = 64;
const SYSTEM_TOP_MARGIN = 28;
const STEM_BELOW = 10;
const MIN_STEM = 16;
const MAX_STEM = 28;
const CHORD_ABOVE = 18;
const BEAM_THICKNESS = 1.8;

/* ── Main component ───────────────────────────────────────── */

interface VisualTabProps {
  document: TabDocument;
}

export const VisualTab: React.FC<VisualTabProps> = ({ document: doc }) => {
  const { measures, diagnostics } = doc;
  if (measures.length === 0) {
    return <p className="tab-empty">No tab data to display.</p>;
  }

  const layout = computeLayout(doc);
  const isClawhammer = doc.mode === 'basic-clawhammer';

  // Get tuning letter labels from the tuning ID
  const tuning = TUNINGS.find((t) => t.notation === doc.tuningId) ?? TUNINGS[0];
  const labels = tuningStringLabels(tuning);

  const svgWidth = layout.maxContentWidth + LEFT_MARGIN + 16;
  const systemContentHeight = STRING_SPACING * 4 + STEM_BELOW + MAX_STEM + 10;
  const systemTotalHeight = systemContentHeight + SYSTEM_TOP_MARGIN;
  const svgHeight = HEADER_HEIGHT + layout.systemCount * systemTotalHeight + 8;

  return (
    <div className="visual-tab">
      <svg
        data-testid="visual-tab-svg"
        data-tab-event-count={layout.systems.reduce((n, s) => n + s.events.length, 0)}
        data-tab-beam-count={layout.systems.reduce((n, s) => n + computeBeamPrimitives(s.events, 0).length, 0)}
        data-tab-mode={doc.mode}
        data-tab-stem-count={layout.systems.reduce((n, s) => n + computeBeamPrimitives(s.events, 0).length * 2, 0)}
        data-tab-meter={doc.meter}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', maxWidth: svgWidth, fontFamily: 'monospace' }}
      >
        {/* Clean header */}
        <text x={LEFT_MARGIN} y={22} fontSize={16} fontWeight="bold" fill="currentColor">
          {doc.title} — {doc.tuningLabel} ({isClawhammer ? 'Clawhammer' : 'Melody'})
        </text>
        <text x={LEFT_MARGIN} y={42} fontSize={12} fill="var(--text-muted, #666)">
          Key: {doc.key} &nbsp; Meter: {doc.meter}
        </text>

        {layout.systems.map((sys, si) => {
          const sysY = HEADER_HEIGHT + si * systemTotalHeight;
          return renderSystem(sys, si, labels, sysY, svgWidth, layout);
        })}
      </svg>

      <p className="tab-diag" style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginTop: 6 }}>
        {diagnostics.measureCount} measure{diagnostics.measureCount !== 1 ? 's' : ''}
        {' · '}{layout.systemCount} system{layout.systemCount !== 1 ? 's' : ''}
        {doc.warnings.length > 0 && ` · ${doc.warnings.length} warning${doc.warnings.length !== 1 ? 's' : ''}`}
      </p>
    </div>
  );
};

/* ── System rendering ──────────────────────────────────────── */

function renderSystem(
  sys: SystemLayout['systems'][0],
  systemIndex: number,
  labels: string[],
  y: number,
  svgWidth: number,
  layout: SystemLayout,
): React.ReactNode {
  const rightEdge = svgWidth - 8;
  const tabBottom = y + STRING_SPACING * 4;

  return (
    <g key={`sys-${systemIndex}`}>
      {/* Measure number — small, at first measure only */}
      <text x={LEFT_MARGIN - 18} y={y + 2 * STRING_SPACING + 5}
        fontSize={11} fill="var(--text-muted, #888)" textAnchor="end">
        {sys.startMeasureNumber}
      </text>

      {/* Time signature — first system only */}
      {systemIndex === 0 && (
        <g>
          <text x={LEFT_MARGIN - 8} y={y + STRING_SPACING + 4}
            fontSize={14} fontWeight="bold" fill="currentColor" textAnchor="end">
            {layout.timeSignature.split('/')[0]}
          </text>
          <text x={LEFT_MARGIN - 8} y={y + 2 * STRING_SPACING + 4}
            fontSize={14} fontWeight="bold" fill="currentColor" textAnchor="end">
            {layout.timeSignature.split('/')[1]}
          </text>
        </g>
      )}

      {/* Tuning letter labels — top to bottom: s1, s2, s3, s4, s5 */}
      {labels.map((label, s) => (
        <text key={`sl-${systemIndex}-${s}`}
          x={LEFT_MARGIN - 24} y={y + s * STRING_SPACING + 5}
          fontSize={13} fontWeight="bold" fill="currentColor" textAnchor="end">
          {label}
        </text>
      ))}

      {/* String lines */}
      {[0, 1, 2, 3, 4].map((s) => (
        <line key={`str-${systemIndex}-${s}`}
          x1={LEFT_MARGIN} y1={y + s * STRING_SPACING}
          x2={rightEdge} y2={y + s * STRING_SPACING}
          stroke="currentColor" strokeWidth={0.6} opacity={0.45} />
      ))}

      {/* Barlines */}
      {sys.barlines.map((bx, bi) => (
        <line key={`bar-${systemIndex}-${bi}`}
          x1={LEFT_MARGIN + bx} y1={y} x2={LEFT_MARGIN + bx} y2={tabBottom}
          stroke="currentColor" strokeWidth={1.5} />
      ))}

      {/* Events with beaming */}
      {renderSystemEvents(sys, systemIndex, y, tabBottom)}
    </g>
  );
}

/* ── System event rendering with beat-pair beaming ─────────── */

function renderSystemEvents(
  sys: SystemLayout['systems'][0],
  systemIndex: number,
  y: number,
  tabBottom: number,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const events = sys.events;
  if (events.length === 0) return elements;

  const beamPrims = computeBeamPrimitives(events, y, LEFT_MARGIN);
  const beamedBeats = new Set(beamPrims.map((b) => b.beatIndex));

  // ── Render BEAMS FIRST (behind stems) ──────────────────────
  if (beamPrims.length > 0) {
    elements.push(
      <g key={`beams-${systemIndex}`} className="tab-beams" data-testid="tab-beams">
        {beamPrims.map((bp) => (
          <rect
            key={`beam-${systemIndex}-${bp.measureIndex}-${bp.beatIndex}`}
            data-testid="tab-beam"
            className="tab-beam"
            x={bp.x}
            y={bp.y}
            width={bp.width}
            height={bp.height}
            fill="currentColor"
            stroke="none"
          />
        ))}
      </g>,
    );
  }

  // ── Render stems + markers ON TOP of beams ─────────────────
  const maxBp = Math.max(...events.map((e) => e.beatPosition ?? 0));
  const beats = Math.max(1, Math.ceil(maxBp / 0.25));
  const beatGroups: PositionedEvent[][] = Array.from({ length: beats }, () => []);

  for (const evt of events) {
    const b = Math.min(Math.floor((evt.beatPosition ?? 0) / 0.25), beats - 1);
    beatGroups[b].push(evt);
  }

  // Find the beam primitive for each beat to derive stem endpoints
  const beamByBeat = new Map<number, (typeof beamPrims)[0]>();
  for (const bp of beamPrims) {
    beamByBeat.set(bp.beatIndex, bp);
  }

  for (let beat = 0; beat < beats; beat++) {
    const group = beatGroups[beat];

    if (beamedBeats.has(beat) && group.length === 2) {
      const bp = beamByBeat.get(beat);
      elements.push(...renderBeamedPair(
        group[0], group[1], systemIndex, elements.length, y, tabBottom, bp,
      ));
    } else {
      for (const evt of group) {
        const cx = LEFT_MARGIN + evt.x;
        elements.push(renderSingleEvent(evt, elements.length, systemIndex, cx, y, tabBottom));
      }
    }
  }

  return elements;
}

/* ── Beamed pair ───────────────────────────────────────────── */

function renderBeamedPair(
  a: PositionedEvent,
  b: PositionedEvent,
  systemIndex: number,
  startIdx: number,
  y: number,
  tabBottom: number,
  beamPrim?: { x: number; y: number; width: number; height: number; measureIndex: number },
): React.ReactNode[] {
  const ax = LEFT_MARGIN + a.x;
  const bx = LEFT_MARGIN + b.x;
  const aStemY = stemYForEvent(a, y);
  const bStemY = stemYForEvent(b, y);

  // Derive stem endpoint from actual beam geometry: bottom of beam + 2px visible tip.
  const beamBottom = beamPrim ? beamPrim.y + beamPrim.height : tabBottom + STEM_BELOW + MIN_STEM;
  const stemEndY = beamBottom + 2;

  const mi = beamPrim?.measureIndex ?? 0;
  const bi = beamPrim ? Math.floor((a.beatPosition ?? 0) / 0.25) : 0;

  return [
    <g key={`bp-${systemIndex}-${startIdx}`}>
      {renderEventMarker(a, ax, y, `${systemIndex}-${startIdx}-a`)}
      {renderEventMarker(b, bx, y, `${systemIndex}-${startIdx}-b`)}
      {/* Explicit, inspectable stem primitives — use <path> for reliable SVG namespace */}
      <path
        data-testid="tab-stem"
        className="tab-stem"
        data-measure-index={mi}
        data-pair-index={bi}
        data-event-index={0}
        data-string-index={a.stringIndex ?? -1}
        data-kind={a.kind}
        d={`M ${ax} ${aStemY} L ${ax} ${stemEndY}`}
        stroke="currentColor" strokeWidth={2} fill="none"
      />
      <path
        data-testid="tab-stem"
        className="tab-stem"
        data-measure-index={mi}
        data-pair-index={bi}
        data-event-index={1}
        data-string-index={b.stringIndex ?? -1}
        data-kind={b.kind}
        d={`M ${bx} ${bStemY} L ${bx} ${stemEndY}`}
        stroke="currentColor" strokeWidth={2} fill="none"
      />
    </g>,
  ];
}

/* ── Single event ──────────────────────────────────────────── */

function renderSingleEvent(
  evt: PositionedEvent,
  idx: number,
  systemIndex: number,
  cx: number,
  y: number,
  tabBottom: number,
): React.ReactNode {
  const key = `ev-${systemIndex}-${idx}`;
  const dur = evt.duration ?? 0.125;
  const needsStem = dur > 0 && (evt.kind === 'note' || evt.kind === 'rest' || evt.kind === 'drone');
  const stemY = needsStem ? stemYForEvent(evt, y) : tabBottom;

  return (
    <g key={key}>
      {renderEventMarker(evt, cx, y, key)}
      {needsStem && renderStemFrom(cx, stemY, tabBottom + STEM_BELOW, dur)}
    </g>
  );
}

/** Compute stem start y from the event's string position. */
function stemYForEvent(
  evt: { kind: string; stringIndex?: number },
  y: number,
): number {
  // For notes: stem starts at the fret number (slightly below the string line)
  // For drones: stem starts at string 5 (bottom) line
  // For rests: stem starts at middle of tab
  if (evt.kind === 'note') {
    const si = evt.stringIndex ?? 0;
    return y + si * STRING_SPACING + 8; // just below the fret number
  }
  if (evt.kind === 'drone') {
    return y + 4 * STRING_SPACING + 8;
  }
  // rest: middle strings
  return y + 2 * STRING_SPACING + 5;
}

/* ── Event marker ──────────────────────────────────────────── */

function renderEventMarker(
  evt: { kind: string; fret?: number; stringIndex?: number; chordLabel?: string },
  cx: number,
  y: number,
  key: string,
): React.ReactNode {
  switch (evt.kind) {
    case 'note': {
      const si = evt.stringIndex ?? 0;
      return (
        <g key={key}>
          {evt.chordLabel && (
            <text x={cx} y={y - CHORD_ABOVE} fontSize={14} fontWeight="bold"
              fill="currentColor" textAnchor="middle">{evt.chordLabel}</text>
          )}
          {evt.fret !== undefined && (
            <text x={cx} y={y + si * STRING_SPACING + 5} fontSize={13}
              fontWeight="bold" fill="currentColor" textAnchor="middle">{evt.fret}</text>
          )}
        </g>
      );
    }
    case 'drone':
      return (
        <text key={key} x={cx} y={y + 4 * STRING_SPACING + 5}
          fontSize={13} fontWeight="bold" fill="currentColor"
          textAnchor="middle">0</text>
      );
    case 'rest':
      return (
        <text key={key} x={cx} y={y + 2 * STRING_SPACING + 5} fontSize={12}
          fill="var(--text-muted, #999)" textAnchor="middle">𝄽</text>
      );
    default:
      return null;
  }
}

/* ── Stem ──────────────────────────────────────────────────── */

/** Render a stem from `yFrom` (note position) down to `yTo` (beam area). */
function renderStemFrom(
  cx: number, yFrom: number, yTo: number, dur: number,
): React.ReactNode {
  const sh = (dur >= 0.5 ? MAX_STEM : dur >= 0.25 ? 20 : MIN_STEM);
  const yEnd = Math.max(yTo, yFrom + sh);
  return (
    <line x1={cx} y1={yFrom} x2={cx} y2={yEnd}
      stroke="currentColor" strokeWidth={BEAM_THICKNESS - 0.2} />
  );
}
