import { describe, it, expect } from 'vitest';
import {
  MIDI_C4,
  pitchClass,
  midiToName,
  nameToMidi,
  LETTER_TO_SEMITONE,
} from '../theory/notes';

describe('note utilities', () => {
  describe('LETTER_TO_SEMITONE', () => {
    it('has correct values for natural notes', () => {
      expect(LETTER_TO_SEMITONE['C']).toBe(0);
      expect(LETTER_TO_SEMITONE['D']).toBe(2);
      expect(LETTER_TO_SEMITONE['E']).toBe(4);
      expect(LETTER_TO_SEMITONE['F']).toBe(5);
      expect(LETTER_TO_SEMITONE['G']).toBe(7);
      expect(LETTER_TO_SEMITONE['A']).toBe(9);
      expect(LETTER_TO_SEMITONE['B']).toBe(11);
    });
  });

  describe('pitchClass', () => {
    it('returns 0 for middle C (60)', () => {
      expect(pitchClass(60)).toBe(0);
    });

    it('returns 2 for D (62)', () => {
      expect(pitchClass(62)).toBe(2);
    });

    it('wraps correctly for values above 11', () => {
      expect(pitchClass(72)).toBe(0); // C5 = 72
      expect(pitchClass(74)).toBe(2); // D5 = 74
    });
  });

  describe('midiToName', () => {
    it('converts middle C (60) to C4', () => {
      expect(midiToName(60)).toBe('C4');
    });

    it('converts D4 (62)', () => {
      expect(midiToName(62)).toBe('D4');
    });

    it('converts G3 (55)', () => {
      expect(midiToName(55)).toBe('G3');
    });

    it('handles sharps', () => {
      expect(midiToName(61)).toBe('C#4');
    });

    it('handles flats', () => {
      expect(midiToName(58)).toBe('Bb3');
    });
  });

  describe('nameToMidi', () => {
    it('converts C4 to 60', () => {
      expect(nameToMidi('C4')).toBe(60);
    });

    it('converts D4 to 62', () => {
      expect(nameToMidi('D4')).toBe(62);
    });

    it('converts G3 to 55', () => {
      expect(nameToMidi('G3')).toBe(55);
    });

    it('handles sharps', () => {
      expect(nameToMidi('F#4')).toBe(66);
    });

    it('handles flats', () => {
      expect(nameToMidi('Bb3')).toBe(58);
    });

    it('throws on invalid input', () => {
      expect(() => nameToMidi('not a note')).toThrow();
    });
  });

  describe('MIDI_C4', () => {
    it('is 60', () => {
      expect(MIDI_C4).toBe(60);
    });
  });
});
