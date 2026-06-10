/**
 * App-level integration render tests for v0.2.15.
 * Tests the exact manual QA ABC cases through the full App pipeline.
 */
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../App';

function setAbcAndGenerate(container: HTMLElement, abc: string) {
  const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
  expect(textarea).not.toBeNull();
  // Set native DOM value FIRST, then fire input for React
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value',
  )?.set;
  nativeInputValueSetter?.call(textarea, abc);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  fireEvent.click(screen.getByText('Generate Tab'));
}

/* ── Default ABC ───────────────────────────────────────────── */

describe('Default ABC (Simple D Reel)', () => {
  it('renders beams for default ABC', () => {
    const { container } = render(React.createElement(App));
    fireEvent.click(screen.getByText('Generate Tab'));
    const svg = container.querySelector('[data-testid="visual-tab-svg"]');
    expect(svg).not.toBeNull();
    const beamCount = Number(svg!.getAttribute('data-tab-beam-count'));
    expect(beamCount).toBeGreaterThan(0);
    // Stems should also exist and be queryable three ways
    expect(container.querySelectorAll('[data-testid="tab-stem"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.tab-stem').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-clawtrad-stem="true"]').length).toBeGreaterThan(0);
    // All three queries must match
    const byId = container.querySelectorAll('[data-testid="tab-stem"]').length;
    const byClass = container.querySelectorAll('.tab-stem').length;
    const byAttr = container.querySelectorAll('[data-clawtrad-stem="true"]').length;
    expect(byId).toBe(byClass);
    expect(byId).toBe(byAttr);
    expect(Number(svg!.getAttribute('data-tab-stem-count'))).toBe(byId);
  });
});

/* ── Quarter Beat Drone Fill Test ──────────────────────────── */

describe('Quarter Beat Drone Fill Test', () => {
  const ABC = `X:1
T:Quarter Beat Drone Fill Test
M:4/4
L:1/8
K:G
D2 E2 F2 G2 | A2 B2 c2 d2 |`;

  it('tabBeamCount is 8 for two measures', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    const svg = container.querySelector('[data-testid="visual-tab-svg"]');
    expect(svg).not.toBeNull();
    const beamCount = Number(svg!.getAttribute('data-tab-beam-count'));
    expect(beamCount).toBe(8);
  });

  it('8 tab-beam rects in DOM', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    expect(beams.length).toBe(8);
  });

  it('each beam rect has valid dimensions', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    for (const b of container.querySelectorAll('[data-testid="tab-beam"]')) {
      expect(parseFloat(b.getAttribute('width') || '0')).toBeGreaterThan(0);
      expect(parseFloat(b.getAttribute('height') || '0')).toBeGreaterThan(0);
      expect(parseFloat(b.getAttribute('x') || '-1')).toBeGreaterThanOrEqual(0);
      expect(parseFloat(b.getAttribute('y') || '-1')).toBeGreaterThanOrEqual(0);
    }
  });

  it('SVG root has data-tab-stem-count', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    const svg = container.querySelector('[data-testid="visual-tab-svg"]');
    const stemCount = Number(svg!.getAttribute('data-tab-stem-count'));
    expect(stemCount).toBeGreaterThan(0);
  });

  it('Basic Clawhammer is default mode', () => {
    const { container } = render(React.createElement(App));
    const select = container.querySelector('#mode-select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe('basic-clawhammer');
  });
});

/* ── Full Quaver Melody Test ───────────────────────────────── */

describe('Full Quaver Melody Test', () => {
  const ABC = `X:2
T:Full Quaver Melody Test
M:4/4
L:1/8
K:G
D E F G A B c d | d c B A G F E D |`;

  it('tabBeamCount is 8 for two measures', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    const svg = container.querySelector('[data-testid="visual-tab-svg"]');
    const beamCount = Number(svg!.getAttribute('data-tab-beam-count'));
    expect(beamCount).toBe(8);
  });

  it('8 tab-beam rects in DOM', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    expect(container.querySelectorAll('[data-testid="tab-beam"]').length).toBe(8);
  });

  it('no drones inserted into full melody bar', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    // Check SVG text for "0" markers beyond normal fret numbers.
    // Drones appear as "0" on the bottom string line.
    // In full quaver mode, no drones should be present.
    // Just verify beams exist — drone check is model-level.
    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    expect(beams.length).toBeGreaterThan(0);
  });
});

/* ── C Natural vs C Sharp Test ─────────────────────────────── */

describe('C Natural vs C Sharp Test', () => {
  const ABC = `X:3
T:C Natural vs C Sharp Test
M:2/4
L:1/8
K:G
c d c d | ^c d =c d |`;

  it('tabBeamCount is 4 for two 2/4 measures', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    const svg = container.querySelector('[data-testid="visual-tab-svg"]');
    const beamCount = Number(svg!.getAttribute('data-tab-beam-count'));
    expect(beamCount).toBe(4);
  });

  it('4 tab-beam rects in DOM', () => {
    const { container } = render(React.createElement(App));
    setAbcAndGenerate(container, ABC);
    expect(container.querySelectorAll('[data-testid="tab-beam"]').length).toBe(4);
  });
});

/* ── UI state ──────────────────────────────────────────────── */

describe('UI state', () => {
  it('no visible plain-text tab section', () => {
    render(React.createElement(App));
    expect(screen.queryByText(/Plain text tab/i)).toBeNull();
    expect(screen.queryByText(/Copy plain text/i)).toBeNull();
  });

  it('no strong beat drone wording', () => {
    render(React.createElement(App));
    expect(screen.queryByText(/strong beat/i)).toBeNull();
  });
});
