/** ClawTrad main application component. */

import React, { useState, useCallback } from 'react';
import { AbcInput } from '../components/AbcInput';
import { TuningSelector } from '../components/TuningSelector';
import { ModeSelector } from '../components/ModeSelector';
import { NotationPreview } from '../components/NotationPreview';
import { VisualTab } from '../components/VisualTab';
import { WarningPanel } from '../components/WarningPanel';
import { parseAbc } from '../music/abc/parseAbc';
import { TUNINGS, type Tuning } from '../music/banjo/tunings';
import type { OutputMode } from '../music/banjo/tabTypes';
import type { TabDocument } from '../music/tab/tabLayoutTypes';
import { arrangeMelody } from '../music/arranger/arrangeMelody';
import { buildTabDocument } from '../music/tab/buildTabDocument';

const DEFAULT_ABC = `X:1
T:Simple D Reel
M:4/4
L:1/8
K:D
|: D2 FA d2 fd | A2 ce a2 ge | f2 d2 e2 c2 | d4 d2 z2 :|`;

export const App: React.FC = () => {
  const [abc, setAbc] = useState(DEFAULT_ABC);
  const [tuningNotation, setTuningNotation] = useState('gDGBD');
  // v0.2.13: Basic Clawhammer is the default mode
  const [outputMode, setOutputMode] = useState<OutputMode>('basic-clawhammer');
  const [tabDocument, setTabDocument] = useState<TabDocument | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const selectedTuning: Tuning =
    TUNINGS.find((t) => t.notation === tuningNotation) ?? TUNINGS[0];

  const handleGenerate = useCallback(() => {
    const parseResult = parseAbc(abc);
    const arrangement = arrangeMelody(parseResult, selectedTuning, outputMode);
    const tabDoc = buildTabDocument(parseResult, arrangement);

    setTabDocument(tabDoc);
    setWarnings(arrangement.warnings);
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
          <WarningPanel warnings={warnings} />
        </section>

        <section className="preview-section">
          <NotationPreview abc={abc} />
        </section>

        <section className="output-section">
          {tabDocument && (
            <VisualTab document={tabDocument} />
          )}
          {!tabDocument && (
            <p className="tab-empty">
              Paste ABC notation and click Generate to see tab here.
            </p>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>
          ClawTrad v0.2.13 — Paste an Irish tune. Choose a tuning. Get a
          clawhammer tab starting point.
        </p>
        <p className="footer-note">
          In Basic Clawhammer mode, open 5th-string drones are added on
          offbeat thumb positions where space allows. Output is a first-pass
          computer-generated arrangement, not a definitive transcription.
        </p>
      </footer>
    </div>
  );
};
