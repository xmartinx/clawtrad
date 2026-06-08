/** ASCII tab output display with copy-to-clipboard support. */

import React, { useState } from 'react';

interface TabOutputProps {
  tabText: string;
}

export const TabOutput: React.FC<TabOutputProps> = ({ tabText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!tabText) return;
    try {
      await navigator.clipboard.writeText(tabText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently fail
    }
  };

  return (
    <div className="tab-output">
      <div className="tab-output-header">
        {tabText && (
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy plain text tab'}
          </button>
        )}
      </div>
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
