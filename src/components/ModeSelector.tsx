/** Output mode selector. */

import React from 'react';
import type { OutputMode } from '../music/banjo/tabTypes';

interface ModeSelectorProps {
  selected: OutputMode;
  onChange: (mode: OutputMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="mode-selector">
      <label htmlFor="mode-select">Output mode:</label>
      <select
        id="mode-select"
        value={selected}
        onChange={(e) => onChange(e.target.value as OutputMode)}
      >
        <option value="melody-only">Melody only</option>
        <option value="basic-clawhammer">Basic clawhammer</option>
      </select>
      <p className="help-text">
        {selected === 'melody-only'
          ? 'Plain melody mapped to tab with no drone notes.'
          : 'Melody with simple 5th-string drone on strong beats (first-pass arrangement).'}
      </p>
    </div>
  );
};
