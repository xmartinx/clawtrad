/** Visual SVG tab rendering for ClawTrad v0.2.
 *
 *  Renders a TabDocument as inline SVG with five horizontal string
 *  lines, fret numbers, barlines, rests, and drone markers.
 */

import React from 'react';
import type { TabDocument, TabMeasure } from '../music/tab/tabLayoutTypes';

/* ── Layout constants ─────────────────────────────────────── */

const STRING_SPACING = 22;       // px between string lines
const LEFT_MARGIN = 36;          // px for string labels
const TOP_MARGIN = 48;           // px for title/tuning line
const BOTTOM_PAD = 16;
const MEASURE_GAP = 10;          // px gap between measures
const COL_WIDTH = 24;            // px per 1/8-note duration unit
const FONT_SIZE = 12;
const LABEL_FONT_SIZE = 13;
const TITLE_FONT_SIZE = 15;

/* ── Main component ───────────────────────────────────────── */

interface VisualTabProps {
  document: TabDocument;
}

export const VisualTab: React.FC<VisualTabProps> = ({ document: doc }) => {
  const { measures, diagnostics } = doc;
  if (measures.length === 0) {
    return <p className="tab-empty">No tab data to display.</p>;
  }

  const svgWidth = computeSvgWidth(measures);
  const tabTop = TOP_MARGIN;
  const tabHeight = STRING_SPACING * 4 + BOTTOM_PAD;
  const svgHeight = tabTop + tabHeight;

  // Tuning labels — extract from tuningId notation (e.g. "gDGBD")
  // The notation is read left-to-right: 5th, 4th, 3rd, 2nd, 1st.
  // We display top-to-bottom: 1st, 2nd, 3rd, 4th, 5th — so reverse.
  const stringLabels = tuningLabels(doc.tuningId);
  const isClawhammer = doc.mode === 'basic-clawhammer';

  return (
    <div className="visual-tab">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', maxWidth: svgWidth, fontFamily: 'monospace' }}
      >
        {/* Title */}
        <text x={LEFT_MARGIN} y={18} fontSize={TITLE_FONT_SIZE} fontWeight="bold" fill="currentColor">
          {doc.title} — {doc.tuningLabel} ({isClawhammer ? 'Clawhammer' : 'Melody'})
        </text>
        <text x={LEFT_MARGIN} y={34} fontSize={FONT_SIZE} fill="var(--text-muted, #666)">
          Key: {doc.key} &nbsp; Meter: {doc.meter} &nbsp;
          Notes: {diagnostics.noteCount} &nbsp;
          Rests: {diagnostics.restCount}
          {diagnostics.unplayableCount > 0 && `  ⚠ ${diagnostics.unplayableCount} unplayable`}
        </text>

        {/* String labels */}
        {stringLabels.map((label, s) => (
          <text
            key={`label-${s}`}
            x={LEFT_MARGIN - 12}
            y={tabTop + s * STRING_SPACING + 5}
            fontSize={LABEL_FONT_SIZE}
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
            key={`string-${s}`}
            x1={LEFT_MARGIN}
            y1={tabTop + s * STRING_SPACING}
            x2={svgWidth - 8}
            y2={tabTop + s * STRING_SPACING}
            stroke="currentColor"
            strokeWidth={s === 4 ? 0.8 : 0.5}
            opacity={s === 4 ? 0.5 : 0.35}
          />
        ))}

        {/* Rendering measures */}
        {renderMeasures(measures, LEFT_MARGIN, tabTop)}
      </svg>

      {/* Diagnostics summary */}
      <p className="tab-diag" style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginTop: 4 }}>
        {diagnostics.measureCount} measure{diagnostics.measureCount !== 1 ? 's' : ''}
        {doc.warnings.length > 0 && ` — ${doc.warnings.length} warning${doc.warnings.length !== 1 ? 's' : ''}`}
      </p>
    </div>
  );
};

/* ── Measure rendering ────────────────────────────────────── */

function renderMeasures(
  measures: TabMeasure[],
  leftMargin: number,
  tabTop: number,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let x = leftMargin;

  for (let mi = 0; mi < measures.length; mi++) {
    const measure = measures[mi];
    if (mi > 0) {
      // Barline
      elements.push(
        <line
          key={`bar-${mi}`}
          x1={x}
          y1={tabTop}
          x2={x}
          y2={tabTop + STRING_SPACING * 4}
          stroke="currentColor"
          strokeWidth={1.5}
        />,
      );
      x += MEASURE_GAP;
    }

    for (let ei = 0; ei < measure.events.length; ei++) {
      const evt = measure.events[ei];
      const w = Math.max(evt.duration * COL_WIDTH * 8, 12); // scale: 1/8 = COL_WIDTH
      const cx = x + w / 2;

      switch (evt.kind) {
        case 'note':
          if (evt.stringIndex !== undefined && evt.fret !== undefined) {
            elements.push(
              <text
                key={`n-${mi}-${ei}`}
                x={cx}
                y={tabTop + evt.stringIndex * STRING_SPACING + 5}
                fontSize={FONT_SIZE}
                fontWeight="bold"
                fill="currentColor"
                textAnchor="middle"
              >
                {evt.fret}
              </text>,
            );
          }
          break;

        case 'drone':
          elements.push(
            <text
              key={`d-${mi}-${ei}`}
              x={cx}
              y={tabTop + 4 * STRING_SPACING + 4}
              fontSize={10}
              fill="var(--text-muted, #999)"
              textAnchor="middle"
            >
              d
            </text>,
          );
          break;

        case 'rest':
          elements.push(
            <text
              key={`r-${mi}-${ei}`}
              x={cx}
              y={tabTop + 2 * STRING_SPACING + 4}
              fontSize={FONT_SIZE}
              fill="var(--text-muted, #999)"
              textAnchor="middle"
            >
              z
            </text>,
          );
          break;

        case 'skipped':
          elements.push(
            <text
              key={`s-${mi}-${ei}`}
              x={cx}
              y={tabTop + 2 * STRING_SPACING + 4}
              fontSize={10}
              fill="#c77"
              textAnchor="middle"
            >
              —
            </text>,
          );
          break;
      }

      x += w;
    }
  }

  return elements;
}

/* ── Helpers ──────────────────────────────────────────────── */

function computeSvgWidth(measures: TabMeasure[]): number {
  let total = 0;
  for (let mi = 0; mi < measures.length; mi++) {
    if (mi > 0) total += MEASURE_GAP;
    for (const evt of measures[mi].events) {
      total += Math.max(evt.duration * COL_WIDTH * 8, 12);
    }
  }
  return Math.max(total + 16, 400);
}

/**
 * Extract string labels from a banjo tuning notation like "gDGBD".
 * The notation is read left-to-right: 5th, 4th, 3rd, 2nd, 1st string.
 * Returns [string1, string2, string3, string4, string5] for display
 * top-to-bottom.
 */
function tuningLabels(tuningId: string): string[] {
  // Parse out individual note letters (ignore case for labels)
  const letters: string[] = [];
  let i = 0;
  while (i < tuningId.length && letters.length < 5) {
    const ch = tuningId[i];
    i++;
    // Handle sharp
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
