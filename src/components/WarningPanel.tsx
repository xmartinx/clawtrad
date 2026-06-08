/** Warning panel for displaying parser/arranger warnings. */

import React from 'react';

interface WarningPanelProps {
  warnings: string[];
}

export const WarningPanel: React.FC<WarningPanelProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="warning-panel">
      <h3>Warnings</h3>
      <ul>
        {warnings.map((w, i) => (
          <li key={i}>⚠ {w}</li>
        ))}
      </ul>
    </div>
  );
};
