/** ASCII tab output display. */

import React from 'react';

interface TabOutputProps {
  tabText: string;
}

export const TabOutput: React.FC<TabOutputProps> = ({ tabText }) => {
  return (
    <div className="tab-output">
      <h3>Generated Tab</h3>
      {tabText ? (
        <pre className="tab-text">{tabText}</pre>
      ) : (
        <p className="tab-empty">
          Paste ABC notation and click Generate to see tab here.
        </p>
      )}
    </div>
  );
};
