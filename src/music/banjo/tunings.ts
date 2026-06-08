/** 5-string banjo tuning definitions for ClawTrad.
 *
 *  String numbering convention (standard 5-string banjo):
 *    String 1 – closest to floor when held in playing position
 *    String 2
 *    String 3
 *    String 4 – lowest pitched string
 *    String 5 – short thumb/drone string, highest pitch
 *
 *  The tuning name is given in standard notation where the lowercase
 *  letter denotes the high 5th string, e.g. "gDGBD" means:
 *    5=g  (G4), 4=D (D3), 3=G (G3), 2=B (B3), 1=D (D4)
 *
 *  Because the octave of each string cannot be reliably inferred from
 *  position alone (string 2 is sometimes octave 3, sometimes octave 4),
 *  we encode exact MIDI pitches for each known tuning.
 */

import { nameToMidi } from '../theory/notes';

export interface TuningDefinition {
  /** Human-readable name (e.g. "Open G"). */
  name: string;
  /** Standard notation string (e.g. "gDGBD"). */
  notation: string;
  /** Optional short description. */
  description: string;
}

export interface Tuning {
  /** Same as TuningDefinition.name */
  name: string;
  /** Same as TuningDefinition.notation */
  notation: string;
  /** Same as TuningDefinition.description */
  description: string;
  /** MIDI pitches for each string, index 0 = string 1, index 4 = string 5. */
  openPitches: number[]; // [string1, string2, string3, string4, string5]
}

/** Available tunings for the MVP. */
export const TUNING_DEFINITIONS: TuningDefinition[] = [
  {
    name: 'Open G',
    notation: 'gDGBD',
    description: 'Standard clawhammer tuning. 5th string drones on G.',
  },
  {
    name: 'Double D',
    notation: 'aDADE',
    description: 'Popular for D tunes. 5th string drones on A.',
  },
  {
    name: 'Sawmill A',
    notation: 'aEADE',
    description: 'Mountain modal tuning. Great for A modal tunes.',
  },
];

/**
 * Explicit MIDI pitches for known tunings.
 *
 * Each entry maps the tuning notation string to [string1, string2, string3, string4, string5]
 * MIDI pitches, encoded via note names for readability.
 *
 * Why explicit: banjo tunings don't follow a simple octave pattern that
 * can be inferred from position alone. String 2 is B3 in Open G but D4
 * in Double D.
 */
const TUNING_PITCHES: Record<string, number[]> = {
  // Open G: 1=D4, 2=B3, 3=G3, 4=D3, 5=G4
  'gDGBD': [
    nameToMidi('D4'),  // string 1
    nameToMidi('B3'),  // string 2
    nameToMidi('G3'),  // string 3
    nameToMidi('D3'),  // string 4
    nameToMidi('G4'),  // string 5
  ],
  // Double D: 1=E4, 2=D4, 3=A3, 4=D3, 5=A4
  'aDADE': [
    nameToMidi('E4'),  // string 1
    nameToMidi('D4'),  // string 2
    nameToMidi('A3'),  // string 3
    nameToMidi('D3'),  // string 4
    nameToMidi('A4'),  // string 5
  ],
  // Sawmill A: 1=E4, 2=D4, 3=A3, 4=E3, 5=A4
  'aEADE': [
    nameToMidi('E4'),  // string 1
    nameToMidi('D4'),  // string 2
    nameToMidi('A3'),  // string 3
    nameToMidi('E3'),  // string 4
    nameToMidi('A4'),  // string 5
  ],
};

/**
 * Parse a TuningDefinition into a Tuning with MIDI pitches.
 * Uses explicit pitch tables for known tunings.
 */
export function parseTuning(def: TuningDefinition): Tuning {
  const pitches = TUNING_PITCHES[def.notation];
  if (!pitches) {
    throw new Error(`Unknown tuning notation: "${def.notation}"`);
  }
  return {
    name: def.name,
    notation: def.notation,
    description: def.description,
    openPitches: [...pitches],
  };
}

/** All available tunings parsed and ready for use. */
export const TUNINGS: Tuning[] = TUNING_DEFINITIONS.map(parseTuning);
