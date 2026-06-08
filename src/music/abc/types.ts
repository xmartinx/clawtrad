/** ABC parsing types for ClawTrad v0.1.1.
 *
 *  Represents a deliberately limited subset of ABC notation sufficient
 *  for simple monophonic Irish dance tunes. Full ABC support is not a
 *  goal for this version.
 */

/** A parsed ABC tune with essential header fields, note events, and diagnostics. */
export interface ParsedAbcTune {
  title: string;
  /** Key signature as written in ABC, e.g. "D", "G", "Edor" */
  keySignature: string;
  /** Meter, e.g. "4/4", "6/8" */
  meter: string;
  /** Default note length, e.g. "1/8" */
  defaultNoteLength: string;
  /** Parsed note events in sequence */
  notes: AbcNote[];
  /** Warnings generated during parsing */
  warnings: string[];
  /** Count of tokens that were skipped (rests, unsupported constructs) */
  skippedTokens: number;
}

/** A single note event from ABC notation. */
export interface AbcNote {
  /** MIDI note number (middle C = 60) */
  pitch: number;
  /** Duration as a fraction of a whole note (e.g. 0.125 = 1/8) */
  duration: number;
  /** The raw ABC token that produced this note */
  raw: string;
}

/**
 * Key-signature to accidentals mapping for Irish traditional music keys.
 *
 * Each entry lists the note letters that are sharpened/flattened by the
 * key signature. These are applied as defaults; explicit accidentals in
 * the tune body override them.
 *
 * The mappings follow standard ABC / music-theory conventions:
 *   - Major keys: standard circle-of-fifths
 *   - Minor keys: natural minor (same as relative major)
 *   - Dorian:    signature of the major key one whole-step below the tonic
 *   - Mixolydian: signature of the major key a perfect fourth below the tonic
 */
export const KEY_SIGNATURES: Record<string, { sharps: string[]; flats: string[] }> = {
  // Major keys — sharps
  'C':     { sharps: [],                 flats: [] },
  'G':     { sharps: ['F'],              flats: [] },
  'D':     { sharps: ['F', 'C'],         flats: [] },
  'A':     { sharps: ['F', 'C', 'G'],    flats: [] },
  'E':     { sharps: ['F', 'C', 'G', 'D'], flats: [] },

  // Major keys — flats
  'F':     { sharps: [],                 flats: ['B'] },
  'Bb':    { sharps: [],                 flats: ['B', 'E'] },

  // Natural minor keys (same key sig as relative major)
  'Am':    { sharps: [],                 flats: [] },      // relative C
  'Em':    { sharps: ['F'],              flats: [] },      // relative G
  'Bm':    { sharps: ['F', 'C'],         flats: [] },      // relative D
  'Dm':    { sharps: [],                 flats: ['B'] },   // relative F

  // Dorian modes
  'Ador':  { sharps: ['F'],              flats: [] },      // A dorian = G major sig
  'Edor':  { sharps: ['F', 'C'],         flats: [] },      // E dorian = D major sig
  'Ddor':  { sharps: [],                 flats: ['B'] },   // D dorian = F major sig

  // Mixolydian modes
  'Amix':  { sharps: ['F', 'C'],         flats: [] },      // A mix = D major sig
  'Dmix':  { sharps: ['F'],              flats: [] },      // D mix = G major sig
};
