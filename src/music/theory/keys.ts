/** Key and mode definitions for Irish traditional music.
 *
 *  Covers the keys most commonly found in Irish dance tunes:
 *  D major, G major, A mixolydian, A dorian, E dorian, and related modes.
 */

export type Mode = 'major' | 'dorian' | 'mixolydian' | 'minor';

export interface KeyDefinition {
  tonic: string;
  mode: Mode;
  /** Number of sharps (positive) or flats (negative) in the key signature. */
  accidentals: number;
  /** MIDI pitch of the tonic (default octave). */
  tonicMidi: number;
}

/**
 * Common Irish traditional keys relevant to ClawTrad v0.1.
 *
 * Tuned for the keys listed in the MVP scope:
 * D, G, A modal, E minor.
 */
export const IRISH_KEYS: Record<string, KeyDefinition> = {
  'D': {
    tonic: 'D', mode: 'major', accidentals: 2, tonicMidi: 62,
  },
  'G': {
    tonic: 'G', mode: 'major', accidentals: 1, tonicMidi: 67,
  },
  'Ador': {
    tonic: 'A', mode: 'dorian', accidentals: 3, tonicMidi: 69,
  },
  'Amix': {
    tonic: 'A', mode: 'mixolydian', accidentals: 2, tonicMidi: 69,
  },
  'Edor': {
    tonic: 'E', mode: 'dorian', accidentals: 2, tonicMidi: 64,
  },
  'Em': {
    tonic: 'E', mode: 'minor', accidentals: 1, tonicMidi: 64,
  },
};
