/** Visual SVG tab rendering for ClawTrad v0.2.1.
 *
 *  Renders a TabDocument as inline SVG with multi-system wrapping.
 *  Each system shows five horizontal string lines with labels,
 *  fret numbers, barlines, rests, and drone markers.
 */

import React from 'react';
import type { TabDocument } from '../music/tab/tabLayoutTypes';
import { computeLayout, LAYOUT, type SystemLayout } from '../music/tab/tabLayout';

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

  const svgWidth = layout.maxContentWidth + LAYOUT.LEFT_MARGIN + 12;
  const systemContentHeight = LAYOUT.SYSTEM_HEIGHT;
  const headerHeight = 48;
  const systemTotalHeight = systemContentHeight + LAYOUT.SYSTEM_TOP_MARGIN;
  const svgHeight = headerHeight + layout.systemCount * systemTotalHeight + 8;

  return (
    <div className="visual-tab">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', maxWidth: svgWidth, fontFamily: 'monospace' }}
      >
        {/* Header — title and diagnostics */}
        <text x={LAYOUT.LEFT_MARGIN} y={18} fontSize={15} fontWeight="bold" fill="currentColor">
          {doc.title} — {doc.tuningLabel} ({isClawhammer ? 'Clawhammer' : 'Melody'})
        </text>
        <text x={LAYOUT.LEFT_MARGIN} y={34} fontSize={12} fill="var(--text-muted, #666)">
          Key: {doc.key} &nbsp; Meter: {doc.meter} &nbsp;
          Notes: {diagnostics.noteCount} &nbsp;
          Rests: {diagnostics.restCount}
          {diagnostics.unplayableCount > 0 && `  ⚠ ${diagnostics.unplayableCount} unplayable`}
        </text>

        {/* Render each system */}
        {layout.systems.map((sys, si) => {
          const sysY = headerHeight + si * systemTotalHeight;
          return renderSystem(sys, si, stringLabels, sysY, svgWidth);
        })}
      </svg>

      {/* Diagnostics summary */}
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
): React.ReactNode {
  const rightEdge = svgWidth - 8;

  return (
    <g key={`sys-${systemIndex}`}>
      {/* String labels */}
      {stringLabels.map((label, s) => (
        <text
          key={`sl-${systemIndex}-${s}`}
          x={LAYOUT.LEFT_MARGIN - 12}
          y={y + s * LAYOUT.STRING_SPACING + 5}
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
          x1={LAYOUT.LEFT_MARGIN}
          y1={y + s * LAYOUT.STRING_SPACING}
          x2={rightEdge}
          y2={y + s * LAYOUT.STRING_SPACING}
          stroke="currentColor"
          strokeWidth={s === 4 ? 0.8 : 0.5}
          opacity={s === 4 ? 0.5 : 0.35}
        />
      ))}

      {/* Barlines */}
      {sys.barlines.map((bx, bi) => (
        <line
          key={`bar-${systemIndex}-${bi}`}
          x1={LAYOUT.LEFT_MARGIN + bx}
          y1={y}
          x2={LAYOUT.LEFT_MARGIN + bx}
          y2={y + LAYOUT.STRING_SPACING * 4}
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}

      {/* Events */}
      {sys.events.map((evt, ei) => {
        const cx = LAYOUT.LEFT_MARGIN + evt.x;
        return renderEvent(evt, ei, systemIndex, cx, y);
      })}
    </g>
  );
}

/* ── Event rendering ───────────────────────────────────────── */

function renderEvent(
  evt: { kind: string; fret?: number; stringIndex?: number },
  eventIndex: number,
  systemIndex: number,
  cx: number,
  y: number,
): React.ReactNode {
  const key = `ev-${systemIndex}-${eventIndex}`;

  switch (evt.kind) {
    case 'note':
      if (evt.stringIndex !== undefined && evt.fret !== undefined) {
        return (
          <text
            key={key}
            x={cx}
            y={y + evt.stringIndex * LAYOUT.STRING_SPACING + 5}
            fontSize={12}
            fontWeight="bold"
            fill="currentColor"
            textAnchor="middle"
          >
            {evt.fret}
          </text>
        );
      }
      return null;

    case 'drone':
      return (
        <text
          key={key}
          x={cx}
          y={y + 4 * LAYOUT.STRING_SPACING + 4}
          fontSize={10}
          fill="var(--text-muted, #999)"
          textAnchor="middle"
        >
          d
        </text>
      );

    case 'rest':
      return (
        <text
          key={key}
          x={cx}
          y={y + 2 * LAYOUT.STRING_SPACING + 4}
          fontSize={12}
          fill="var(--text-muted, #999)"
          textAnchor="middle"
        >
          z
        </text>
      );

    case 'skipped':
      return (
        <text
          key={key}
          x={cx}
          y={y + 2 * LAYOUT.STRING_SPACING + 4}
          fontSize={10}
          fill="#c77"
          textAnchor="middle"
        >
          —
        </text>
      );

    default:
      return null;
  }
}

/* ── Helpers ───────────────────────────────────────────────── */

/**
 * Extract string labels from a banjo tuning notation like "gDGBD".
 * Notation is read left-to-right: 5th, 4th, 3rd, 2nd, 1st string.
 * Returns [string1, string2, string3, string4, string5] for display.
 */
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
  // letters = [5th, 4th, 3rd, 2nd, 1st]
  // Return [1st, 2nd, 3rd, 4th, 5th]
  return [letters[4], letters[3], letters[2], letters[1], letters[0]];
}
