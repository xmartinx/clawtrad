/** ClawTrad main application component. */

import React, { useState, useCallback } from 'react';
import { AbcInput } from '../components/AbcInput';
import { TuningSelector } from '../components/TuningSelector';
import { ModeSelector } from '../components/ModeSelector';
import { NotationPreview } from '../components/NotationPreview';
import { TabOutput } from '../components/TabOutput';
import { WarningPanel } from '../components/WarningPanel';
import { parseAbc } from '../music/abc/parseAbc';
import { TUNINGS, type Tuning } from '../music/banjo/tunings';
import type { OutputMode } from '../music/banjo/tabTypes';
import { arrangeMelody } from '../music/arranger/arrangeMelody';
import { renderAsciiTab } from '../music/render/asciiTab';

const DEFAULT_ABC = `X:1
T:Simple D Reel
M:4/4
L:1/8
K:D
|: D2 FA d2 fd | A2 ce a2 ge | f2 d2 e2 c2 | d4 d2 z2 :|`;

export interface Diagnostics {
  parsedNotes: number;
  skippedTokens: number;
  tuningName: string;
  tuningNotation: string;
  outputMode: OutputMode;
  keySignature: string;
  unplayableCount: number;
}

export const App: React.FC = () => {
  const [abc, setAbc] = useState(DEFAULT_ABC);
  const [tuningNotation, setTuningNotation] = useState('gDGBD');
  const [outputMode, setOutputMode] = useState<OutputMode>('melody-only');
  const [tabText, setTabText] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);

  const selectedTuning: Tuning =
    TUNINGS.find((t) => t.notation === tuningNotation) ?? TUNINGS[0];

  const handleGenerate = useCallback(() => {
    const parseResult = parseAbc(abc);
    const arrangement = arrangeMelody(parseResult, selectedTuning, outputMode);
    const rendered = renderAsciiTab(arrangement, selectedTuning);

    // Count unplayable notes from warnings
    const unplayableCount = arrangement.warnings.filter((w) =>
      w.includes('no playable position'),
    ).length;

    setTabText(rendered);
    setWarnings(arrangement.warnings);
    setDiagnostics({
      parsedNotes: parseResult.notes.length,
      skippedTokens: parseResult.skippedTokens,
      tuningName: selectedTuning.name,
      tuningNotation: selectedTuning.notation,
      outputMode,
      keySignature: parseResult.keySignature,
      unplayableCount,
    });
  }, [abc, selectedTuning, outputMode]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>ClawTrad</h1>
        <p className="tagline">
          Turn Irish ABC notation into playable clawhammer banjo tab.
        </p>
      </header>

      <main className="app-main">
        <section className="input-section">
          <AbcInput value={abc} onChange={setAbc} />
          <div className="controls">
            <TuningSelector
              selected={tuningNotation}
              onChange={setTuningNotation}
            />
            <ModeSelector selected={outputMode} onChange={setOutputMode} />
            <button className="generate-btn" onClick={handleGenerate}>
              Generate Tab
            </button>
          </div>
          {diagnostics && (
            <div className="diagnostics">
              <span>Key: {diagnostics.keySignature}</span>
              <span>Tuning: {diagnostics.tuningName} ({diagnostics.tuningNotation})</span>
              <span>Mode: {diagnostics.outputMode === 'melody-only' ? 'Melody' : 'Clawhammer'}</span>
              <span>Notes: {diagnostics.parsedNotes}</span>
              {diagnostics.unplayableCount > 0 && (
                <span className="diag-warn">Unplayable: {diagnostics.unplayableCount}</span>
              )}
            </div>
          )}
          <WarningPanel warnings={warnings} />
        </section>

        <section className="preview-section">
          <NotationPreview abc={abc} />
        </section>

        <section className="output-section">
          <TabOutput tabText={tabText} />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          ClawTrad v0.1.1 — Paste an Irish tune. Choose a tuning. Get a
          clawhammer tab starting point.
        </p>
        <p className="footer-note">
          Output is a first-pass computer-generated arrangement, not a
          definitive transcription. All arrangements should be reviewed by
          a musician before use.
        </p>
      </footer>
    </div>
  );
};
