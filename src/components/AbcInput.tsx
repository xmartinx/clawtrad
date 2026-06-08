/** ABC notation paste area. */

import React from 'react';

interface AbcInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const AbcInput: React.FC<AbcInputProps> = ({ value, onChange }) => {
  return (
    <div className="abc-input">
      <label htmlFor="abc-textarea">
        Paste your ABC notation here:
      </label>
      <textarea
        id="abc-textarea"
        rows={10}
        placeholder={`X:1
T:My Tune
M:4/4
L:1/8
K:D
|: D2 FA d2 fd | A2 ce a2 ge :|`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};
