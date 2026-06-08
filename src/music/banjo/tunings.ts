/** 5-string banjo tuning definitions for ClawTrad v0.2.5.
 *
 *  String numbering convention (standard 5-string banjo):
 *    String 1 – closest to floor when held in playing position
 *    String 2
 *    String 3
 *    String 4 – lowest pitched (main) string
 *    String 5 – short thumb/drone string, highest pitch
 *
 *  The tuning name is given in standard notation where the lowercase
 *  letter denotes the high 5th string, e.g. "gDGBD" means:
 *    5=g  (G4), 4=D (D3), 3=G (G3), 2=B (B3), 1=D (D4)
 */

import { nameToMidi } from '../theory/notes';

export interface TuningDefinition {
  name: string;
  notation: string;
  description: string;
}

export interface Tuning {
  name: string;
  notation: string;
  description: string;
  /** MIDI pitches for each string, index 0 = string 1, index 4 = string 5. */
  openPitches: number[];
  /**
   * Semitone offset applied to ABC pitches before fretboard mapping.
   * Standard banjo range is ~1 octave below written ABC, so most
   * tunings use −12.  This ensures ABC uppercase D maps to open 4th
   * string in Open G / Double D, and ABC uppercase C maps to open
   * 4th string in Double C.
   */
  pitchOffset: number;
}

export const TUNING_DEFINITIONS: TuningDefinition[] = [
  {
    name: 'Open G',
    notation: 'gDGBD',
    description: 'Standard clawhammer tuning. 5th string drones on G.',
  },
  {
    name: 'Double C',
    notation: 'gCGCD',
    description: 'Classic old-time clawhammer tuning. Great for C and modal tunes.',
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

/** Explicit MIDI pitches and ABC pitch offsets for known tunings. */
const TUNING_DATA: Record<string, { pitches: number[]; offset: number }> = {
  // Open G: 1=D4, 2=B3, 3=G3, 4=D3, 5=G4  — anchor: D3 on 4th string
  'gDGBD': {
    pitches: [nameToMidi('D4'), nameToMidi('B3'), nameToMidi('G3'), nameToMidi('D3'), nameToMidi('G4')],
    offset: -12,  // ABC D4 → banjo D3
  },
  // Double C: 1=D4, 2=C4, 3=G3, 4=C3, 5=G4  — anchor: C3 on 4th string
  'gCGCD': {
    pitches: [nameToMidi('D4'), nameToMidi('C4'), nameToMidi('G3'), nameToMidi('C3'), nameToMidi('G4')],
    offset: -12,  // ABC C4 → banjo C3
  },
  // Double D: 1=E4, 2=D4, 3=A3, 4=D3, 5=A4  — anchor: D3 on 4th string
  'aDADE': {
    pitches: [nameToMidi('E4'), nameToMidi('D4'), nameToMidi('A3'), nameToMidi('D3'), nameToMidi('A4')],
    offset: -12,
  },
  // Sawmill A: 1=E4, 2=D4, 3=A3, 4=E3, 5=A4
  'aEADE': {
    pitches: [nameToMidi('E4'), nameToMidi('D4'), nameToMidi('A3'), nameToMidi('E3'), nameToMidi('A4')],
    offset: -12,
  },
};

export function parseTuning(def: TuningDefinition): Tuning {
  const data = TUNING_DATA[def.notation];
  if (!data) throw new Error(`Unknown tuning notation: "${def.notation}"`);
  return {
    name: def.name,
    notation: def.notation,
    description: def.description,
    openPitches: [...data.pitches],
    pitchOffset: data.offset,
  };
}

export const TUNINGS: Tuning[] = TUNING_DEFINITIONS.map(parseTuning);

/** Get tuning letter labels for left-of-tab display, top (string 1) to bottom (string 5).
 *  Returns [s1label, s2label, s3label, s4label, s5label] where s5 (drone) is lowercase. */
export function tuningStringLabels(tuning: Tuning): string[] {
  const letterMap: Record<number, string> = {
    0: 'C', 1: 'C#', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
    6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'Bb', 11: 'B',
  };
  // openPitches = [s1, s2, s3, s4, s5]
  // Display top-to-bottom: s1, s2, s3, s4, s5 — 5th string lowercase
  return tuning.openPitches.map((p, i) => {
    const pc = ((p % 12) + 12) % 12;
    const letter = letterMap[pc] ?? '?';
    return i === 4 ? letter.toLowerCase() : letter;
  });
}

// Re-export for convenience
export { nameToMidi };
