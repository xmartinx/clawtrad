/**
 * Comprehensive ABC parser tests for v0.1.1.
 */
import { describe, it, expect } from 'vitest';
import { parseAbc } from '../abc/parseAbc';
import { KEY_SIGNATURES } from '../abc/types';

describe('ABC header parsing', () => {
  it('extracts title from T: field', () => {
    const result = parseAbc(`X:1\nT:My Test Tune\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    expect(result.title).toBe('My Test Tune');
  });

  it('defaults title to "Untitled" when no T: field', () => {
    const result = parseAbc(`X:1\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    expect(result.title).toBe('Untitled');
  });

  it('extracts meter from M: field', () => {
    const result = parseAbc(`X:1\nT:T\nM:3/4\nL:1/8\nK:D\nD2 E2 F2 |`);
    expect(result.meter).toBe('3/4');
  });

  it('defaults meter to 4/4 when no M: field', () => {
    const result = parseAbc(`X:1\nT:T\nL:1/8\nK:D\nD2 E2 F2 |`);
    expect(result.meter).toBe('4/4');
  });

  it('extracts default note length from L: field', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/4\nK:D\nD E F G |`);
    expect(result.defaultNoteLength).toBe('1/4');
  });

  it('extracts key signature from K: field', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:G\nG A B c |`);
    expect(result.keySignature).toBe('G');
  });
});

describe('key signature mapping', () => {
  it('D major has F# and C#', () => {
    const ks = KEY_SIGNATURES['D'];
    expect(ks.sharps).toContain('F');
    expect(ks.sharps).toContain('C');
    expect(ks.flats).toEqual([]);
  });

  it('G major has F# only', () => {
    const ks = KEY_SIGNATURES['G'];
    expect(ks.sharps).toEqual(['F']);
  });

  it('C major has no accidentals', () => {
    const ks = KEY_SIGNATURES['C'];
    expect(ks.sharps).toEqual([]);
    expect(ks.flats).toEqual([]);
  });

  it('E dorian has F# and C#', () => {
    const ks = KEY_SIGNATURES['Edor'];
    expect(ks.sharps).toContain('F');
    expect(ks.sharps).toContain('C');
  });

  it('A dorian has F#', () => {
    const ks = KEY_SIGNATURES['Ador'];
    expect(ks.sharps).toEqual(['F']);
  });

  it('A mixolydian has F# and C#', () => {
    const ks = KEY_SIGNATURES['Amix'];
    expect(ks.sharps).toContain('F');
    expect(ks.sharps).toContain('C');
  });

  it('D mixolydian has F#', () => {
    const ks = KEY_SIGNATURES['Dmix'];
    expect(ks.sharps).toEqual(['F']);
  });

  it('E minor has F#', () => {
    const ks = KEY_SIGNATURES['Em'];
    expect(ks.sharps).toEqual(['F']);
  });

  it('A minor has no accidentals', () => {
    const ks = KEY_SIGNATURES['Am'];
    expect(ks.sharps).toEqual([]);
    expect(ks.flats).toEqual([]);
  });

  it('F major has Bb', () => {
    const ks = KEY_SIGNATURES['F'];
    expect(ks.flats).toEqual(['B']);
  });

  it('warns on unknown key signature', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:F#m\nD E F G |`);
    const hasWarn = result.warnings.some((w) => w.includes('not fully supported'));
    expect(hasWarn).toBe(true);
  });
});

describe('key signature application to notes', () => {
  it('applies F# in D major', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nF2 |`);
    expect(result.notes[0].pitch).toBe(66); // F#4
  });

  it('applies F# in G major', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:G\nF |`);
    expect(result.notes[0].pitch).toBe(66); // F#4
  });

  it('does not sharp F in C major', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\nF |`);
    expect(result.notes[0].pitch).toBe(65); // F4 natural
  });

  it('applies both F# and C# in D major', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nC D E F |`);
    expect(result.notes[0].pitch).toBe(61); // C#4
    expect(result.notes[3].pitch).toBe(66); // F#4
  });
});

describe('accidentals', () => {
  it('sharp (^) raises note by 1 semitone', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\n^F |`);
    expect(result.notes[0].pitch).toBe(66); // F#4 (from F4=65+1)
  });

  it('double sharp (^^) raises note by 2 semitones', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\n^^F |`);
    expect(result.notes[0].pitch).toBe(67); // F##4 = G4
  });

  it('flat (_) lowers note by 1 semitone', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\n_B |`);
    expect(result.notes[0].pitch).toBe(70); // Bb4 (from B4=71-1)
  });

  it('double flat (__) lowers note by 2 semitones', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\n__B |`);
    expect(result.notes[0].pitch).toBe(69); // Bbb4 = A4
  });

  it('natural (=) cancels key signature sharp', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\n=F |`);
    expect(result.notes[0].pitch).toBe(65); // F4 natural (not F#4=66)
  });

  it('natural (=) cancels key signature flat', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:F\n=B |`);
    expect(result.notes[0].pitch).toBe(71); // B4 natural (not Bb4=70)
  });

  it('explicit sharp overrides key signature', () => {
    // In G major, F is already F#. An explicit ^F should still be F#.
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:G\n^F |`);
    expect(result.notes[0].pitch).toBe(66); // F#4
  });

  it('accidental applies only to the immediately following note', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\n^F G |`);
    expect(result.notes[0].pitch).toBe(66); // F#4 (sharp applied)
    expect(result.notes[1].pitch).toBe(67); // G4 (no accidental, just natural)
  });
});

describe('octave markers', () => {
  it('uppercase C is middle C (MIDI 60)', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\nC |`);
    expect(result.notes[0].pitch).toBe(60); // C4
  });

  it('lowercase c is C5 (MIDI 72)', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\nc |`);
    expect(result.notes[0].pitch).toBe(72); // C5
  });

  it('comma lowers by one octave', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\nC, |`);
    expect(result.notes[0].pitch).toBe(48); // C3
  });

  it('apostrophe raises by one octave', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\nc' |`);
    expect(result.notes[0].pitch).toBe(84); // C6
  });

  it('multiple commas lower multiple octaves', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\nC,, |`);
    expect(result.notes[0].pitch).toBe(36); // C2
  });

  it('lowercase with comma', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:C\nc, |`);
    expect(result.notes[0].pitch).toBe(60); // C4 (C5 lowered by 1 octave)
  });
});

describe('unsupported feature warnings', () => {
  it('warns on grace notes', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\n{G}D2 E2 |`);
    const hasWarn = result.warnings.some((w) => w.includes('Grace notes'));
    expect(hasWarn).toBe(true);
  });

  it('warns on tuplet markers', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\n(3D E F G2 |`);
    const hasWarn = result.warnings.some((w) => w.includes('Tuplet'));
    expect(hasWarn).toBe(true);
  });

  it('warns on decorations', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\n!trill!D2 E2 |`);
    const hasWarn = result.warnings.some((w) =>
      w.includes('Decorations') || w.includes('decorations'),
    );
    expect(hasWarn).toBe(true);
  });

  it('warns on broken rhythm markers', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 >E2 |`);
    const hasWarn = result.warnings.some((w) => w.includes('Broken rhythm'));
    expect(hasWarn).toBe(true);
  });

  it('warns on chord annotations', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\n"D"D2 E2 |`);
    const hasWarn = result.warnings.some((w) =>
      w.includes('Chord symbols') || w.includes('Chord annotations') || w.includes('chord'),
    );
    expect(hasWarn).toBe(true);
  });
});

describe('skipped tokens count', () => {
  it('counts bar lines and spaces as skipped', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 | F2 G2 |`);
    expect(result.skippedTokens).toBeGreaterThan(0);
  });

  it('rests count as skipped', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 z2 |`);
    expect(result.skippedTokens).toBeGreaterThan(0);
  });

  it('has non-zero skipped count for typical tune', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\n|: D2 FA d2 fd :|`);
    // Should have bar lines, repeat markers, repeat colons, spaces etc.
    expect(result.skippedTokens).toBeGreaterThan(0);
  });
});

describe('note count', () => {
  it('parses correct number of notes', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 E2 F2 G2 |`);
    expect(result.notes).toHaveLength(4);
  });

  it('handles mixed uppercase and lowercase', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD E F G A B c d |`);
    expect(result.notes).toHaveLength(8);
  });

  it('skips rests from note count', () => {
    const result = parseAbc(`X:1\nT:T\nM:4/4\nL:1/8\nK:D\nD2 z2 E2 z2 |`);
    expect(result.notes).toHaveLength(2);
  });

  it('counts note events (not note letters) correctly', () => {
    const simple = parseAbc(`X:1\nT:T\nK:D\nD E F G |`);
    expect(simple.notes).toHaveLength(4);
  });
});
