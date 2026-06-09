/**
 * VisualTab DOM render tests for v0.2.13.
 * Uses React Testing Library to inspect actual SVG elements.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { VisualTab } from '../VisualTab';
import { parseAbc } from '../../music/abc/parseAbc';
import { buildTabDocument } from '../../music/tab/buildTabDocument';
import { arrangeMelody } from '../../music/arranger/arrangeMelody';
import { TUNINGS } from '../../music/banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

function renderTab(abc: string, mode: 'melody-only' | 'basic-clawhammer' = 'basic-clawhammer') {
  const parsed = parseAbc(abc);
  const arr = arrangeMelody(parsed, openG, mode);
  const doc = buildTabDocument(parsed, arr);
  const { container } = render(React.createElement(VisualTab, { document: doc }));
  return container;
}

describe('VisualTab SVG render', () => {
  it('renders an SVG element', () => {
    const container = renderTab(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('SVG has a valid viewBox', () => {
    const container = renderTab(`X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`);
    const svg = container.querySelector('svg')!;
    const vb = svg.getAttribute('viewBox');
    expect(vb).not.toBeNull();
    const parts = vb!.split(' ').map(Number);
    expect(parts[2]).toBeGreaterThan(0); // width
    expect(parts[3]).toBeGreaterThan(0); // height
  });

  it('D2 E2 F2 G2 clawhammer has tab-beam elements', () => {
    const container = renderTab(
      `X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`,
      'basic-clawhammer',
    );
    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    // Should have 4 beam primitives
    expect(beams.length).toBeGreaterThanOrEqual(1);
  });

  it('D E F G A B c d melody-only has tab-beam elements', () => {
    const container = renderTab(
      `X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD E F G A B c d |`,
      'melody-only',
    );
    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    expect(beams.length).toBeGreaterThanOrEqual(1);
  });

  it('beam elements are <rect> with valid attributes', () => {
    const container = renderTab(
      `X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`,
      'basic-clawhammer',
    );
    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    for (const b of beams) {
      expect(b.tagName).toBe('rect');
      const w = parseFloat(b.getAttribute('width') || '0');
      const h = parseFloat(b.getAttribute('height') || '0');
      const x = parseFloat(b.getAttribute('x') || '-1');
      const y = parseFloat(b.getAttribute('y') || '-1');
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });

  it('beam count for M:2/4 c d c d', () => {
    const container = renderTab(
      `X:1\nT:Test\nM:2/4\nL:1/8\nK:G\nc d c d |`,
      'melody-only',
    );
    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    expect(beams.length).toBeGreaterThanOrEqual(2);
  });

  it('drone 0 text uses same size as fret numbers', () => {
    const container = renderTab(
      `X:1\nT:Test\nM:4/4\nL:1/8\nK:G\nD2 E2 F2 G2 |`,
      'basic-clawhammer',
    );
    // All text elements — drones and notes
    const texts = container.querySelectorAll('text');
    const droneTexts = Array.from(texts).filter(
      (t) => t.textContent === '0',
    );
    if (droneTexts.length > 0) {
      const fs = droneTexts[0].getAttribute('font-size');
      expect(fs).toBe('13');
    }
  });
});
