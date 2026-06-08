/** Note normalisation and pitch utilities.
 *
 *  Uses MIDI note numbers (middle C = 60) as the internal pitch
 *  representation because they are integer, enharmonic, and trivial
 *  to map onto a fretboard.
 */

/** MIDI number for middle C. */
export const MIDI_C4 = 60;

/** Semitone offset from C for each natural note letter. */
export const LETTER_TO_SEMITONE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** Reverse map: semitone class → preferred letter name (natural/spelled). */
export const SEMITONE_TO_LETTER: Record<number, string> = {
  0: 'C', 1: 'C#', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
  6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'Bb', 11: 'B',
};

/**
 * Return the pitch class (0–11) for a MIDI note number.
 */
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/**
 * Return a human-readable note name from a MIDI number, e.g. "D4", "F#5".
 */
export function midiToName(midi: number): string {
  const pc = pitchClass(midi);
  const octave = Math.floor(midi / 12) - 1;
  return `${SEMITONE_TO_LETTER[pc]}${octave}`;
}

/**
 * Return the MIDI number for a note name like "D4" or "F#5".
 */
export function nameToMidi(name: string): number {
  const m = name.match(/^([A-G][#b]?)(-?\d+)$/i);
  if (!m) throw new Error(`Invalid note name: "${name}"`);
  const [, letterPart, octaveStr] = m;
  const letter = letterPart[0].toUpperCase();
  const accidental = letterPart.slice(1);
  const octave = Number(octaveStr);
  let semitone = LETTER_TO_SEMITONE[letter];
  if (accidental === '#') semitone++;
  else if (accidental === 'b') semitone--;
  return (octave + 1) * 12 + semitone;
}

/**
 * Normalise a MIDI pitch to a target octave for comparison purposes.
 */
export function normaliseOctave(midi: number, targetOctave = 4): number {
  const oct = Math.floor(midi / 12);
  const diff = targetOctave - oct;
  return midi + diff * 12;
}
