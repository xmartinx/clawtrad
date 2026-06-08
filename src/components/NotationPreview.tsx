/** Standard notation preview using abcjs.
 *
 *  Renders the ABC input as engraved standard music notation.
 *  Falls back to a simple message when abcjs cannot render the input.
 */

import React, { useRef, useEffect } from 'react';
import abcjs from 'abcjs';

interface NotationPreviewProps {
  abc: string;
}

export const NotationPreview: React.FC<NotationPreviewProps> = ({ abc }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    if (!abc.trim()) return;

    try {
      abcjs.renderAbc(containerRef.current, abc, {
        responsive: 'resize',
        staffwidth: 740,
      });
    } catch {
      containerRef.current.innerHTML =
        '<p class="notation-fallback">Could not render notation preview.</p>';
    }
  }, [abc]);

  return (
    <div className="notation-preview">
      <h3>Notation Preview</h3>
      <div ref={containerRef} />
    </div>
  );
};
