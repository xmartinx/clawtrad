/** Tuning selector dropdown. */

import React from 'react';
import { TUNING_DEFINITIONS, type TuningDefinition } from '../music/banjo/tunings';

interface TuningSelectorProps {
  selected: string; // notation string, e.g. "gDGBD"
  onChange: (notation: string) => void;
}

export const TuningSelector: React.FC<TuningSelectorProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="tuning-selector">
      <label htmlFor="tuning-select">Tuning:</label>
      <select
        id="tuning-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {TUNING_DEFINITIONS.map((t: TuningDefinition) => (
          <option key={t.notation} value={t.notation}>
            {t.name} ({t.notation})
          </option>
        ))}
      </select>
      <p className="help-text">
        {TUNING_DEFINITIONS.find((t) => t.notation === selected)?.description}
      </p>
    </div>
  );
};
