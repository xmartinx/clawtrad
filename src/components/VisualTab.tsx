/** Visual SVG tab rendering for ClawTrad v0.2.4.
 *
 *  Corrected layout:
 *  - Top line = string 1, bottom line = string 5 (drone)
 *  - String labels: simple "1"–"5" at left
 *  - 5th string: drone "0" only, never fretted melody
 *  - Clean header: title/tuning/mode only, no note/rest counts
 *  - Larger chord labels, more header space
 *  - Thicker stems, beam grouping for adjacent short notes
 *  - Skipped notes as "x" with stem/beam treatment
 */

import React from 'react';
import type { TabDocument } from '../music/tab/tabLayoutTypes';
import type { PositionedEvent, SystemLayout } from '../music/tab/tabLayout';
import { computeLayout } from '../music/tab/tabLayout';

/* ── Layout constants ──────────────────────────────────────── */

const STRING_SPACING = 24;
const LEFT_MARGIN = 50;
const HEADER_HEIGHT = 64;          // more space above first system
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

  const svgWidth = layout.maxContentWidth + LEFT_MARGIN + 16;
  const systemContentHeight = STRING_SPACING * 4 + STEM_BELOW + MAX_STEM + 10;
  const systemTotalHeight = systemContentHeight + SYSTEM_TOP_MARGIN;
  const svgHeight = HEADER_HEIGHT + layout.systemCount * systemTotalHeight + 8;

  return (
    <div className="visual-tab">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', maxWidth: svgWidth, fontFamily: 'monospace' }}
      >
        {/* Clean header */}
        <text x={LEFT_MARGIN} y={22} fontSize={16} fontWeight="bold" fill="currentColor">
          {doc.title} — {doc.tuningLabel} ({isClawhammer ? 'Clawhammer' : 'Melody'})
        </text>
        <text x={LEFT_MARGIN} y={42} fontSize={12} fill="var(--text-muted, #666)">
          Key: {doc.key} &nbsp; Meter: {doc.meter}
          {diagnostics.unplayableCount > 0 && `  ⚠ ${diagnostics.unplayableCount} unplayable`}
        </text>

        {/* Systems */}
        {layout.systems.map((sys, si) => {
          const sysY = HEADER_HEIGHT + si * systemTotalHeight;
          return renderSystem(sys, si, sysY, svgWidth, layout);
        })}
      </svg>

      {/* Diagnostics below tab */}
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
  y: number,
  svgWidth: number,
  layout: SystemLayout,
): React.ReactNode {
  const rightEdge = svgWidth - 8;
  const tabBottom = y + STRING_SPACING * 4;

  return (
    <g key={`sys-${systemIndex}`}>
      {/* Measure number */}
      <text
        x={LEFT_MARGIN - 18}
        y={y + 2 * STRING_SPACING + 5}
        fontSize={11}
        fill="var(--text-muted, #888)"
        textAnchor="end"
      >
        {sys.startMeasureNumber}
      </text>

      {/* Time signature — first system only */}
      {systemIndex === 0 && (
        <g>
          <text
            x={LEFT_MARGIN - 8}
            y={y + STRING_SPACING + 4}
            fontSize={14}
            fontWeight="bold"
            fill="currentColor"
            textAnchor="end"
          >
            {layout.timeSignature.split('/')[0]}
          </text>
          <text
            x={LEFT_MARGIN - 8}
            y={y + 2 * STRING_SPACING + 4}
            fontSize={14}
            fontWeight="bold"
            fill="currentColor"
            textAnchor="end"
          >
            {layout.timeSignature.split('/')[1]}
          </text>
        </g>
      )}

      {/* String labels: simple numbers */}
      {['1', '2', '3', '4', '5'].map((label, s) => (
        <text
          key={`sl-${systemIndex}-${s}`}
          x={LEFT_MARGIN - 24}
          y={y + s * STRING_SPACING + 5}
          fontSize={12}
          fontWeight="bold"
          fill="currentColor"
          textAnchor="end"
        >
          {label}
        </text>
      ))}

      {/* String lines — string 5 at bottom, slightly thinner */}
      {[0, 1, 2, 3, 4].map((s) => (
        <line
          key={`str-${systemIndex}-${s}`}
          x1={LEFT_MARGIN}
          y1={y + s * STRING_SPACING}
          x2={rightEdge}
          y2={y + s * STRING_SPACING}
          stroke="currentColor"
          strokeWidth={0.6}
          opacity={0.45}
        />
      ))}

      {/* Barlines */}
      {sys.barlines.map((bx, bi) => (
        <line
          key={`bar-${systemIndex}-${bi}`}
          x1={LEFT_MARGIN + bx}
          y1={y}
          x2={LEFT_MARGIN + bx}
          y2={tabBottom}
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}

      {/* Events with beam grouping */}
      {renderEventsWithBeams(sys.events, systemIndex, y, tabBottom)}
    </g>
  );
}

/* ── Event rendering with beam grouping ────────────────────── */

function renderEventsWithBeams(
  events: PositionedEvent[],
  systemIndex: number,
  y: number,
  tabBottom: number,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  // Build beam groups: consecutive notes (and skipped) with dur <= 0.25
  let i = 0;
  while (i < events.length) {
    const evt = events[i];

    // Check for beamable group: note/skipped/drone with short duration
    if (
      (evt.kind === 'note' || evt.kind === 'skipped' || evt.kind === 'drone') &&
      evt.duration !== undefined &&
      evt.duration <= 0.25 &&
      evt.duration > 0
    ) {
      const group: PositionedEvent[] = [];
      while (
        i < events.length &&
        (events[i].kind === 'note' || events[i].kind === 'skipped' || events[i].kind === 'drone') &&
        events[i].duration !== undefined &&
        events[i].duration <= 0.25 &&
        events[i].duration > 0
      ) {
        group.push(events[i]);
        i++;
      }

      // Render beam group
      elements.push(...renderBeamGroup(group, systemIndex, y, tabBottom));
    } else {
      // Single event (rest, or long note)
      const cx = LEFT_MARGIN + evt.x;
      elements.push(renderEvent(evt, elements.length, systemIndex, cx, y, tabBottom, false));
      i++;
    }
  }

  return elements;
}

function renderBeamGroup(
  group: PositionedEvent[],
  systemIndex: number,
  y: number,
  tabBottom: number,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  // Render each event (fret/x/drone marker + chord label)
  group.forEach((evt, gi) => {
    const cx = LEFT_MARGIN + evt.x;
    const key = `ev-${systemIndex}-bg-${gi}`;

    switch (evt.kind) {
      case 'note':
        elements.push(renderNoteMarker(evt, key, cx, y));
        break;
      case 'skipped':
        elements.push(renderSkippedMarker(evt, key, cx, y));
        break;
      case 'drone':
        elements.push(renderDroneMarker(key, cx, y));
        break;
    }
  });

  // Beam: horizontal line connecting all stems, plus vertical stems
  if (group.length >= 2) {
    const firstX = LEFT_MARGIN + group[0].x;
    const lastX = LEFT_MARGIN + group[group.length - 1].x;
    const stemBaseY = tabBottom + STEM_BELOW;
    const stemTopY = stemBaseY + MIN_STEM;

    // Vertical stems
    group.forEach((evt, gi) => {
      const sx = LEFT_MARGIN + evt.x;
      elements.push(
        <line
          key={`stem-${systemIndex}-bg-${gi}`}
          x1={sx}
          y1={stemBaseY}
          x2={sx}
          y2={stemTopY}
          stroke="currentColor"
          strokeWidth={BEAM_THICKNESS}
        />,
      );
    });

    // Horizontal beam
    elements.push(
      <line
        key={`beam-${systemIndex}-bg`}
        x1={firstX}
        y1={stemTopY}
        x2={lastX}
        y2={stemTopY}
        stroke="currentColor"
        strokeWidth={BEAM_THICKNESS}
      />,
    );
  } else if (group.length === 1) {
    // Single short note: stem + flag
    const sx = LEFT_MARGIN + group[0].x;
    const stemBaseY = tabBottom + STEM_BELOW;
    const stemTopY = stemBaseY + MIN_STEM;
    elements.push(
      <line
        key={`stem-${systemIndex}-bg-s`}
        x1={sx} y1={stemBaseY} x2={sx} y2={stemTopY}
        stroke="currentColor" strokeWidth={BEAM_THICKNESS}
      />,
    );
    // Flag
    elements.push(
      <line
        key={`flag-${systemIndex}-bg-s`}
        x1={sx} y1={stemTopY - 6}
        x2={sx + 10} y2={stemTopY - 10}
        stroke="currentColor" strokeWidth={1.5}
      />,
    );
  }

  return elements;
}

/* ── Individual event rendering ────────────────────────────── */

function renderEvent(
  evt: { kind: string; fret?: number; stringIndex?: number; duration?: number; chordLabel?: string },
  eventIndex: number,
  systemIndex: number,
  cx: number,
  y: number,
  tabBottom: number,
  inBeam: boolean,
): React.ReactNode {
  const key = `ev-${systemIndex}-${eventIndex}`;
  const dur = evt.duration ?? 0.125;

  switch (evt.kind) {
    case 'note': {
      const el = renderNoteMarker(evt, key, cx, y);
      if (!inBeam && dur > 0) {
        return (
          <g key={key}>
            {el}
            {renderStem(cx, tabBottom, dur, false)}
          </g>
        );
      }
      return <g key={key}>{el}</g>;
    }

    case 'drone':
      return <g key={key}>{renderDroneMarker(key, cx, y)}</g>;

    case 'rest': {
      return (
        <g key={key}>
          <text x={cx} y={y + 2 * STRING_SPACING + 5} fontSize={12}
            fill="var(--text-muted, #999)" textAnchor="middle">z</text>
          {!inBeam && dur > 0 && renderStem(cx, tabBottom, dur, false)}
        </g>
      );
    }

    case 'skipped': {
      const el = renderSkippedMarker(evt, key, cx, y);
      if (!inBeam && dur > 0) {
        return (
          <g key={key}>
            {el}
            {renderStem(cx, tabBottom, dur, false)}
          </g>
        );
      }
      return <g key={key}>{el}</g>;
    }

    default:
      return null;
  }
}

/* ── Markers ───────────────────────────────────────────────── */

function renderNoteMarker(
  evt: { fret?: number; stringIndex?: number; chordLabel?: string },
  key: string,
  cx: number,
  y: number,
): React.ReactNode {
  const strIdx = evt.stringIndex ?? 0;
  return (
    <g key={key}>
      {evt.chordLabel && (
        <text x={cx} y={y - CHORD_ABOVE} fontSize={14} fontWeight="bold"
          fill="currentColor" textAnchor="middle">{evt.chordLabel}</text>
      )}
      {evt.fret !== undefined && (
        <text x={cx} y={y + strIdx * STRING_SPACING + 5} fontSize={13}
          fontWeight="bold" fill="currentColor" textAnchor="middle">{evt.fret}</text>
      )}
    </g>
  );
}

function renderSkippedMarker(
  _evt: { stringIndex?: number },
  key: string,
  cx: number,
  y: number,
): React.ReactNode {
  return (
    <text key={key} x={cx} y={y + 2 * STRING_SPACING + 5} fontSize={13}
      fill="#c55" fontWeight="bold" textAnchor="middle">x</text>
  );
}

function renderDroneMarker(key: string, cx: number, y: number): React.ReactNode {
  return (
    <text key={key} x={cx} y={y + 4 * STRING_SPACING + 5} fontSize={10}
      fill="var(--text-muted, #888)" textAnchor="middle">0</text>
  );
}

/* ── Stem helper ───────────────────────────────────────────── */

function renderStem(
  cx: number,
  tabBottom: number,
  dur: number,
  _flagged: boolean,
): React.ReactNode {
  const stemBaseY = tabBottom + STEM_BELOW;
  const sh = stemHeight(dur);
  const stemTopY = stemBaseY + sh;

  return (
    <g>
      <line x1={cx} y1={stemBaseY} x2={cx} y2={stemTopY}
        stroke="currentColor" strokeWidth={BEAM_THICKNESS - 0.2} />
      {dur <= 0.125 && (
        <line x1={cx} y1={stemTopY - 4}
          x2={cx + 8} y2={stemTopY - 8}
          stroke="currentColor" strokeWidth={1.3} />
      )}
    </g>
  );
}

function stemHeight(duration: number): number {
  if (duration >= 0.5) return MAX_STEM;
  if (duration >= 0.25) return 22;
  return MIN_STEM;
}
