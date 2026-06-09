/**
 * App-level integration render tests for v0.2.14.
 * Uses the full App component pipeline.
 */
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../App';

describe('App integration: beam rendering', () => {
  it('renders App and finds Generate button', () => {
    render(React.createElement(App));
    expect(screen.getByText('ClawTrad')).toBeDefined();
    expect(screen.getByText('Generate Tab')).toBeDefined();
  });

  it('after clicking Generate, SVG contains tab-beam elements', () => {
    const { container } = render(React.createElement(App));
    fireEvent.click(screen.getByText('Generate Tab'));

    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    expect(beams.length).toBeGreaterThan(0);
  });

  it('SVG has diagnostic data attributes', () => {
    const { container } = render(React.createElement(App));
    fireEvent.click(screen.getByText('Generate Tab'));

    const svg = container.querySelector('[data-testid="visual-tab-svg"]');
    expect(svg).not.toBeNull();
    const beamCount = svg!.getAttribute('data-tab-beam-count');
    expect(beamCount).not.toBeNull();
    expect(Number(beamCount)).toBeGreaterThan(0);
    const mode = svg!.getAttribute('data-tab-mode');
    expect(mode).toBe('basic-clawhammer');
  });

  it('each beam rect has valid dimensions', () => {
    const { container } = render(React.createElement(App));
    fireEvent.click(screen.getByText('Generate Tab'));

    const beams = container.querySelectorAll('[data-testid="tab-beam"]');
    expect(beams.length).toBeGreaterThan(0);
    for (const b of beams) {
      expect(parseFloat(b.getAttribute('width') || '0')).toBeGreaterThan(0);
      expect(parseFloat(b.getAttribute('height') || '0')).toBeGreaterThan(0);
      expect(parseFloat(b.getAttribute('x') || '-1')).toBeGreaterThanOrEqual(0);
      expect(parseFloat(b.getAttribute('y') || '-1')).toBeGreaterThanOrEqual(0);
    }
  });

  it('default mode is Basic Clawhammer', () => {
    const { container } = render(React.createElement(App));
    const select = container.querySelector('#mode-select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe('basic-clawhammer');
  });

  it('no visible plain-text tab section', () => {
    render(React.createElement(App));
    // The plain text fallback section should not be in the DOM
    // (TabOutput component is no longer rendered in App)
    expect(screen.queryByText(/Plain text tab/i)).toBeNull();
    expect(screen.queryByText(/Copy plain text/i)).toBeNull();
  });
});
