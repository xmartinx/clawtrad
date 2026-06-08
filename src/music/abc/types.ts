/** ABC parsing types for ClawTrad v0.1.
 *
 *  Represents a deliberately limited subset of ABC notation sufficient
 *  for simple monophonic Irish dance tunes. Full ABC support is not a
 *  goal for this version.
 */

/** A parsed ABC tune with essential header fields and note events. */
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

/** Known key-signature to accidentals mapping. */
export const KEY_SIGNATURES: Record<string, { sharps: string[]; flats: string[] }> = {
  'C':  { sharps: [],           flats: [] },
  'G':  { sharps: ['F'],        flats: [] },
  'D':  { sharps: ['F','C'],    flats: [] },
  'A':  { sharps: ['F','C','G'], flats: [] },
  'E':  { sharps: ['F','C','G','D'], flats: [] },
  'F':  { sharps: [],           flats: ['B'] },
  'Bb': { sharps: [],           flats: ['B','E'] },
  'Cm': { sharps: [],           flats: [] },
  'Dm': { sharps: [],           flats: ['B'] },
  'Em': { sharps: ['F'],        flats: [] },  // E dorian typically 2 sharps
  'Edor': { sharps: ['F','C'],  flats: [] },  // E dorian = 2 sharps
  'Ador': { sharps: ['F','C','G'], flats: [] },  // A dorian = 3 sharps
  'Amix': { sharps: ['F','C'],  flats: [] },  // A mixolydian = 2 sharps
};
