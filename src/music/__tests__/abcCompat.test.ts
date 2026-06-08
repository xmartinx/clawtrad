/**
 * Real-world ABC compatibility tests for v0.2.2.
 * All fixtures are synthetic — no real third-party tunes.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { buildTabDocument } from '../tab/buildTabDocument';
import { arrangeMelody } from '../arranger/arrangeMelody';
import { TUNINGS } from '../banjo/tunings';

const openG = TUNINGS.find((t) => t.name === 'Open G')!;

/* ── Header tolerance ──────────────────────────────────────── */

describe('ABC header tolerance', () => {
  it('handles missing K: with fallback to C and warning', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nD E F G |`);
    expect(result.keySignature).toBe('C');
    expect(result.parseDiagnostics.keyWasMissing).toBe(true);
    expect(result.warnings.some((w) => w.includes('Missing key signature'))).toBe(true);
  });

  it('handles missing M: with fallback to 4/4 and warning', () => {
    const result = parseAbc(`X:1\nT:Test\nL:1/8\nK:D\nD E F G |`);
    expect(result.meter).toBe('4/4');
    expect(result.parseDiagnostics.meterWasMissing).toBe(true);
    expect(result.warnings.some((w) => w.includes('Missing meter'))).toBe(true);
  });

  it('handles missing L: with fallback to 1/8 and warning', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nK:D\nD E F G |`);
    expect(result.defaultNoteLength).toBe('1/8');
    expect(result.parseDiagnostics.lengthWasMissing).toBe(true);
    expect(result.warnings.some((w) => w.includes('Missing default note length'))).toBe(true);
  });

  it('handles multiple T: lines — first is title, rest are alternates', () => {
    const result = parseAbc(`X:1\nT:Main Title\nT:Alt Title\nM:4/4\nL:1/8\nK:D\nD E F G |`);
    expect(result.title).toBe('Main Title');
    expect(result.alternateTitles).toContain('Alt Title');
  });

  it('accepts unknown single-letter headers without crashing', () => {
    const result = parseAbc(`X:1\nT:Test\nA:Some Author\nB:Some Book\nM:4/4\nL:1/8\nK:D\nD E F G |`);
    expect(result.otherHeaders['A']).toBe('Some Author');
    expect(result.otherHeaders['B']).toBe('Some Book');
    // Should not crash
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it('stores common extra headers like C:, S:, R:, Z:, N:', () => {
    const result = parseAbc(`X:1\nT:Test\nC:Composer Name\nS:Source\nR:Reel\nZ:Transcriber\nN:Notes\nM:4/4\nL:1/8\nK:D\nD E F G |`);
    expect(result.otherHeaders['C']).toBe('Composer Name');
    expect(result.otherHeaders['S']).toBe('Source');
    expect(result.otherHeaders['R']).toBe('Reel');
    expect(result.otherHeaders['Z']).toBe('Transcriber');
    expect(result.otherHeaders['N']).toBe('Notes');
  });

  it('parse diagnostics includes header count', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G |`);
    expect(result.parseDiagnostics.headerCount).toBeGreaterThanOrEqual(4);
  });
});

/* ── Comment handling ──────────────────────────────────────── */

describe('comment handling', () => {
  it('ignores full-line comments starting with %', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n% this is a comment\nD E F G |`);
    expect(result.notes).toHaveLength(4);
  });

  it('ignores inline comments after %', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E % comment\nF G |`);
    expect(result.notes).toHaveLength(4);
  });
});

/* ── Body tolerance ────────────────────────────────────────── */

describe('body tolerance', () => {
  it('handles repeated barlines |: and :|', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n|: D E F G :|`);
    expect(result.notes).toHaveLength(4);
    // Should not crash
  });

  it('handles double barlines ||', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E || F G |`);
    expect(result.notes).toHaveLength(4);
  });

  it('handles end barlines |]', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E F G |]`);
    expect(result.notes).toHaveLength(4);
  });

  it('handles start repeat [|', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n[| D E F G |`);
    expect(result.notes).toHaveLength(4);
  });

  it('ignores first/second ending markers [1 and [2', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E | [1 F G :| [2 A B |]`);
    expect(result.notes).toHaveLength(6); // D E F G A B
  });

  it('ignores chord symbols in quotes', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n"D" D2 "G" E2 "Em" F2 "A" G2 |`);
    expect(result.notes).toHaveLength(4);
    const hasChordWarn = result.warnings.some((w) =>
      w.toLowerCase().includes('chord'),
    );
    expect(hasChordWarn).toBe(true);
  });

  it('ignores grace notes and warns', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n{G}D2 {A}E2 F G |`);
    expect(result.notes).toHaveLength(4); // D E F G
    const hasGraceWarn = result.warnings.some((w) =>
      w.toLowerCase().includes('grace'),
    );
    expect(hasGraceWarn).toBe(true);
  });

  it('ignores +decorations+ and warns', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n+trill+D2 +roll+E2 F G |`);
    expect(result.notes).toHaveLength(4); // D E F G (the + is stripped by preprocessor)
    const hasDecoWarn = result.warnings.some((w) =>
      w.toLowerCase().includes('decorations'),
    );
    expect(hasDecoWarn).toBe(true);
  });

  it('ignores broken rhythm markers and warns', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD >E F <G |`);
    expect(result.notes).toHaveLength(4);
    const hasRhythmWarn = result.warnings.some((w) =>
      w.toLowerCase().includes('broken rhythm'),
    );
    expect(hasRhythmWarn).toBe(true);
  });

  it('ignores tuplet markers and warns', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n(3D E F G2 |`);
    expect(result.notes).toHaveLength(4);
    const hasTupletWarn = result.warnings.some((w) =>
      w.toLowerCase().includes('tuplet'),
    );
    expect(hasTupletWarn).toBe(true);
  });

  it('handles slurs/ties: skips parentheses around notes', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n(D E) (F G) |`);
    // The parens are stripped; notes remain
    expect(result.notes).toHaveLength(4);
  });

  it('handles tie hyphens between notes', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD-E F-G |`);
    expect(result.notes).toHaveLength(4);
  });

  it('handles blank lines between header and body', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n\n\nD E F G |`);
    expect(result.notes).toHaveLength(4);
  });

  it('does not crash on completely malformed body', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n!!! @@ ?? 123 |`);
    expect(result.notes).toHaveLength(0);
  });
});

/* ── Warning quality ───────────────────────────────────────── */

describe('warning deduplication and quality', () => {
  it('deduplicates warnings', () => {
    // Multiple chord symbols should generate only one chord warning
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n"D"D2 "G"E2 "A"F2 G2 |`);
    const chordWarnings = result.warnings.filter((w) =>
      w.toLowerCase().includes('chord'),
    );
    expect(chordWarnings.length).toBe(1);
  });

  it('unsupported features are listed in diagnostics', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\n{D}D2 !trill!E2 >F2 (3G A B |`);
    expect(result.parseDiagnostics.unsupportedFeatures.length).toBeGreaterThan(0);
    // Should include grace-notes, decorations, broken-rhythm, tuplets
    expect(result.parseDiagnostics.unsupportedFeatures).toContain('grace-notes');
    expect(result.parseDiagnostics.unsupportedFeatures).toContain('decorations');
    expect(result.parseDiagnostics.unsupportedFeatures).toContain('broken-rhythm');
    expect(result.parseDiagnostics.unsupportedFeatures).toContain('tuplets');
  });

  it('barline count is tracked in diagnostics', () => {
    const result = parseAbc(`X:1\nT:Test\nM:4/4\nL:1/8\nK:D\nD E | F G | A B | c d |`);
    expect(result.parseDiagnostics.barlineCount).toBeGreaterThanOrEqual(3);
  });
});

/* ── Integration: parser → tab document after messy input ──── */

describe('tab document from messy ABC', () => {
  it('builds valid TabDocument from ABC with many unsupported features', () => {
    const messy = `X:1
T:Messy Test Tune
C:Some Composer
S:Some Source
R:Reel
M:4/4
L:1/8
K:D
% Here comes the tune
|: "D"{A}D2 FA | "G"d2 "A"fd | [1 A2 c2 :| [2 d4 |]`;
    const parsed = parseAbc(messy);
    const arrangement = arrangeMelody(parsed, openG, 'melody-only');
    const doc = buildTabDocument(parsed, arrangement);

    expect(doc.title).toBe('Messy Test Tune');
    expect(doc.key).toBe('D');
    expect(doc.measures.length).toBeGreaterThanOrEqual(1);
    expect(doc.diagnostics.noteCount).toBeGreaterThan(0);
    // Should have chord and grace warnings
    expect(parsed.warnings.some((w) => w.toLowerCase().includes('chord'))).toBe(true);
    expect(parsed.warnings.some((w) => w.toLowerCase().includes('grace'))).toBe(true);
  });

  it('handles ABC with line continuation backslash', () => {
    const continued = `X:1
T:Continued
M:4/4
L:1/8
K:D
D2 E2 \\
F2 G2 |`;
    const parsed = parseAbc(continued);
    expect(parsed.notes.length).toBeGreaterThanOrEqual(2);
  });
});
