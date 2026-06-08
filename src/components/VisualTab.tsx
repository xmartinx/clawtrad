/** Visual SVG tab rendering for ClawTrad v0.2.3.
 *
 *  Renders a TabDocument as inline SVG with multi-system wrapping.
 *  Each system shows five horizontal string lines, measure numbers,
 *  time signature, fret numbers, barlines, rests, skipped "x" markers,
 *  rhythm stems, chord labels, and drone markers.
 */

import React from 'react';
import type { TabDocument } from '../music/tab/tabLayoutTypes';
import { computeLayout, LAYOUT, type SystemLayout } from '../music/tab/tabLayout';

/* ── Layout constants ──────────────────────────────────────── */

const STRING_SPACING = LAYOUT.STRING_SPACING;
const LEFT_MARGIN = 52;           // wider to fit measure numbers + time sig
const SYSTEM_TOP_MARGIN = 24;     // px gap between systems
const STEM_HEIGHT = 14;           // px below tab for rhythm stems
const STEM_BELOW = 8;             // px gap from lowest string line to top of stems
const CHORD_ABOVE = 14;           // px above top string line for chord labels

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
  const stringLabels = tuningLabels(doc.tuningId);
  const isClawhammer = doc.mode === 'basic-clawhammer';

  const svgWidth = layout.maxContentWidth + LEFT_MARGIN + 12;
  const systemContentHeight = STRING_SPACING * 4 + STEM_BELOW + STEM_HEIGHT + 8;
  const headerHeight = 48;
  const systemTotalHeight = systemContentHeight + SYSTEM_TOP_MARGIN;
  const svgHeight = headerHeight + layout.systemCount * systemTotalHeight + 8;

  return (
    <div className="visual-tab">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', maxWidth: svgWidth, fontFamily: 'monospace' }}
      >
        {/* Header */}
        <text x={LEFT_MARGIN} y={18} fontSize={15} fontWeight="bold" fill="currentColor">
          {doc.title} — {doc.tuningLabel} ({isClawhammer ? 'Clawhammer' : 'Melody'})
        </text>
        <text x={LEFT_MARGIN} y={34} fontSize={12} fill="var(--text-muted, #666)">
          Key: {doc.key} &nbsp; Meter: {doc.meter} &nbsp;
          Notes: {diagnostics.noteCount} &nbsp;
          Rests: {diagnostics.restCount}
          {diagnostics.unplayableCount > 0 && `  ⚠ ${diagnostics.unplayableCount} unplayable`}
        </text>

        {/* Systems */}
        {layout.systems.map((sys, si) => {
          const sysY = headerHeight + si * systemTotalHeight;
          return renderSystem(sys, si, stringLabels, sysY, svgWidth, layout);
        })}
      </svg>

      <p className="tab-diag" style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginTop: 4 }}>
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
  stringLabels: string[],
  y: number,
  svgWidth: number,
  layout: SystemLayout,
): React.ReactNode {
  const rightEdge = svgWidth - 8;
  const tabBottom = y + STRING_SPACING * 4;

  return (
    <g key={`sys-${systemIndex}`}>
      {/* Measure number at left of system */}
      <text
        x={LEFT_MARGIN - 18}
        y={y + 2 * STRING_SPACING + 5}
        fontSize={11}
        fill="var(--text-muted, #888)"
        textAnchor="end"
      >
        {sys.startMeasureNumber}
      </text>

      {/* Time signature — first system only, left of strings */}
      {systemIndex === 0 && (
        <g>
          <text
            x={LEFT_MARGIN - 8}
            y={y + STRING_SPACING + 4}
            fontSize={13}
            fontWeight="bold"
            fill="currentColor"
            textAnchor="end"
          >
            {layout.timeSignature.split('/')[0]}
          </text>
          <text
            x={LEFT_MARGIN - 8}
            y={y + 2 * STRING_SPACING + 4}
            fontSize={13}
            fontWeight="bold"
            fill="currentColor"
            textAnchor="end"
          >
            {layout.timeSignature.split('/')[1]}
          </text>
        </g>
      )}

      {/* String labels */}
      {stringLabels.map((label, s) => (
        <text
          key={`sl-${systemIndex}-${s}`}
          x={LEFT_MARGIN - 26}
          y={y + s * STRING_SPACING + 5}
          fontSize={13}
          fontWeight="bold"
          fill="currentColor"
          textAnchor="end"
        >
          {label}
        </text>
      ))}

      {/* String lines */}
      {[0, 1, 2, 3, 4].map((s) => (
        <line
          key={`str-${systemIndex}-${s}`}
          x1={LEFT_MARGIN}
          y1={y + s * STRING_SPACING}
          x2={rightEdge}
          y2={y + s * STRING_SPACING}
          stroke="currentColor"
          strokeWidth={s === 4 ? 0.8 : 0.5}
          opacity={s === 4 ? 0.5 : 0.35}
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

      {/* Events */}
      {sys.events.map((evt, ei) => {
        const cx = LEFT_MARGIN + evt.x;
        return renderEvent(evt, ei, systemIndex, cx, y, tabBottom);
      })}
    </g>
  );
}

/* ── Event rendering ───────────────────────────────────────── */

function renderEvent(
  evt: { kind: string; fret?: number; stringIndex?: number; duration?: number; chordLabel?: string },
  eventIndex: number,
  systemIndex: number,
  cx: number,
  y: number,
  tabBottom: number,
): React.ReactNode {
  const key = `ev-${systemIndex}-${eventIndex}`;
  const dur = evt.duration ?? 0.125;

  switch (evt.kind) {
    case 'note':
      return renderNoteEvent(evt, key, cx, y, tabBottom, dur);

    case 'drone':
      return (
        <text
          key={key}
          x={cx}
          y={y + 4 * STRING_SPACING + 4}
          fontSize={10}
          fill="var(--text-muted, #999)"
          textAnchor="middle"
        >
          d
        </text>
      );

    case 'rest': {
      const elements: React.ReactNode[] = [
        <text
          key={key}
          x={cx}
          y={y + 2 * STRING_SPACING + 4}
          fontSize={12}
          fill="var(--text-muted, #999)"
          textAnchor="middle"
        >
          z
        </text>,
      ];
      if (dur > 0) {
        elements.push(
          <line
            key={`${key}-stem`}
            x1={cx}
            y1={tabBottom + STEM_BELOW}
            x2={cx}
            y2={tabBottom + STEM_BELOW + stemHeight(dur)}
            stroke="var(--text-muted, #999)"
            strokeWidth={1}
          />,
        );
      }
      return <g key={key}>{elements}</g>;
    }

    case 'skipped':
      return renderSkippedEvent(evt, key, cx, y);

    default:
      return null;
  }
}

/* ── Note with chord label + stem ──────────────────────────── */

function renderNoteEvent(
  evt: { fret?: number; stringIndex?: number; chordLabel?: string },
  key: string,
  cx: number,
  y: number,
  tabBottom: number,
  dur: number,
): React.ReactNode {
  const strIdx = evt.stringIndex ?? 0;
  const elements: React.ReactNode[] = [];

  // Chord label above
  if (evt.chordLabel) {
    elements.push(
      <text
        key={`${key}-chord`}
        x={cx}
        y={y - CHORD_ABOVE}
        fontSize={11}
        fontWeight="bold"
        fill="currentColor"
        textAnchor="middle"
      >
        {evt.chordLabel}
      </text>,
    );
  }

  // Fret number on the correct string
  if (evt.stringIndex !== undefined && evt.fret !== undefined) {
    elements.push(
      <text
        key={`${key}-fret`}
        x={cx}
        y={y + strIdx * STRING_SPACING + 5}
        fontSize={12}
        fontWeight="bold"
        fill="currentColor"
        textAnchor="middle"
      >
        {evt.fret}
      </text>,
    );
  }

  // Rhythm stem below tab
  if (dur > 0) {
    const sh = stemHeight(dur);
    elements.push(
      <line
        key={`${key}-stem`}
        x1={cx}
        y1={tabBottom + STEM_BELOW}
        x2={cx}
        y2={tabBottom + STEM_BELOW + sh}
        stroke="currentColor"
        strokeWidth={1.2}
      />,
    );
    // Beam flag for shorter notes
    if (dur <= 0.125) {
      elements.push(
        <line
          key={`${key}-beam`}
          x1={cx}
          y1={tabBottom + STEM_BELOW + sh - 8}
          x2={cx + 8}
          y2={tabBottom + STEM_BELOW + sh - 10}
          stroke="currentColor"
          strokeWidth={1.2}
        />,
      );
    }
  }

  return <g key={key}>{elements}</g>;
}

/* ── Skipped event: "x" on expected string ─────────────────── */

function renderSkippedEvent(
  evt: { stringIndex?: number; sourcePitch?: number },
  key: string,
  cx: number,
  y: number,
): React.ReactNode {
  const strIdx = evt.stringIndex ?? 2; // default to middle string
  return (
    <text
      key={key}
      x={cx}
      y={y + strIdx * STRING_SPACING + 5}
      fontSize={12}
      fill="#c77"
      fontWeight="bold"
      textAnchor="middle"
    >
      x
    </text>
  );
}

/* ── Rhythm stem helper ────────────────────────────────────── */

function stemHeight(duration: number): number {
  // Longer notes get slightly taller stems; shorter notes get flag/beam
  if (duration >= 0.5) return 16;
  if (duration >= 0.25) return 12;
  return 10;
}

/* ── Tuning labels ─────────────────────────────────────────── */

function tuningLabels(tuningId: string): string[] {
  const letters: string[] = [];
  let i = 0;
  while (i < tuningId.length && letters.length < 5) {
    const ch = tuningId[i];
    i++;
    if (i < tuningId.length && tuningId[i] === '#') {
      letters.push(ch + '#');
      i++;
    } else {
      letters.push(ch);
    }
  }
  return [letters[4], letters[3], letters[2], letters[1], letters[0]];
}
