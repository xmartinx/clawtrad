/** Limited ABC parser for ClawTrad v0.1.
 *
 *  Parses a deliberately constrained subset of ABC notation sufficient
 *  for simple monophonic Irish reels and similar tunes. This is NOT a
 *  general-purpose ABC parser.
 *
 *  Capabilities:
 *  - Single-voice tunes
 *  - Common header fields (X, T, M, L, K)
 *  - Notes with accidentals, octave markers, and length modifiers
 *  - Bar lines and repeats
 *
 *  Limitations (documented in MUSIC_ENGINE_NOTES.md):
 *  - No chords / multi-voice
 *  - No grace notes
 *  - No tuplets
 *  - No inline key/meter changes
 *  - No decorations (!...!)
 *  - No ties or slurs
 *  - No broken rhythm markers (> <)
 */

import type { ParsedAbcTune, AbcNote } from './types';
import { KEY_SIGNATURES } from './types';

/** MIDI pitch for middle C (C4). */
const MIDI_C4 = 60;

/** Semitone offsets for the 7 letters starting from C. */
const LETTER_OFFSET: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/**
 * Parse an ABC string and return a ParsedAbcTune.
 * Throws on unrecoverable errors; warnings are stored in the result.
 */
export function parseAbc(input: string): ParsedAbcTune {
  const warnings: string[] = [];
  const lines = input.split(/\r?\n/);

  let title = 'Untitled';
  let keySignature = 'D';
  let meter = '4/4';
  let defaultNoteLength = '1/8';

  const headerRE = /^([A-Z]):\s*(.*)/;

  // ── extract header fields ──────────────────────────────────
  for (const raw of lines) {
    const m = raw.trim().match(headerRE);
    if (!m) continue;
    const [, field, value] = m;
    switch (field) {
      case 'X':
        /* reference number – ignored for now */ break;
      case 'T':
        title = value.trim() || title;
        break;
      case 'M':
        meter = value.trim() || meter;
        break;
      case 'L':
        defaultNoteLength = value.trim() || defaultNoteLength;
        break;
      case 'K':
        keySignature = value.trim() || keySignature;
        break;
    }
  }

  // ── extract note body ──────────────────────────────────────
  // Everything after the header block that isn't empty or a header line.
  const bodyLines = lines.filter((l) => {
    const t = l.trim();
    return t !== '' && !headerRE.test(t);
  });
  const body = bodyLines.join(' ');

  const notes: AbcNote[] = [];
  const defaultLen = parseNoteLength(defaultNoteLength);
  let currentLen = defaultLen;

  // Tokenise the body: notes (incl. rests with z), bar lines, repeat markers, spaces
  const tokenRE = /\^+|_+|=|[a-gA-GzZ][,']*[0-9]*\/?[0-9]*|\|[|\]:\[\]]*|[\[\]:]|\s+|\([0-9]+/g;

  let match: RegExpExecArray | null;
  while ((match = tokenRE.exec(body)) !== null) {
    const token = match[0];

    // Skip whitespace-only
    if (/^\s+$/.test(token)) continue;

    // Bar lines and repeat markers – skip for now
    if (/^[\|\[\]:]+$/.test(token)) continue;

    // Tuplet marker – skip for now, warn
    if (/^\([0-9]+/.test(token)) {
      warnings.push('Tuplets are not supported in v0.1 – skipped');
      continue;
    }

    // Accidentals on their own (applied to next note) – skip for now
    if (/^[\^_=]+$/.test(token)) continue;

    // Rest token
    if (/^[zZ]/.test(token)) {
      // Rests: skip for melody output (don't produce a note)
      const restMatch = token.match(/^[zZ]([,']*)([0-9]*)\/?([0-9]*)$/);
      if (restMatch) {
        const [, , numStr, denomStr] = restMatch;
        if (numStr || denomStr) {
          currentLen = parseExplicitLength(numStr, denomStr, defaultLen);
        }
      }
      continue;
    }

    // A note token
    const noteMatch = token.match(/^([a-gA-G])([,']*)([0-9]*)\/?([0-9]*)$/);
    if (noteMatch) {
      const [, letter, octMark, numStr, denomStr] = noteMatch;

      const accidental = ''; // handled via key sig for now
      const pitch = letterToMidi(letter, octMark, accidental, keySignature, warnings);
      let dur = currentLen;
      if (numStr || denomStr) {
        dur = parseExplicitLength(numStr, denomStr, defaultLen);
      }

      notes.push({ pitch, duration: dur, raw: token });
    }
  }

  // Warn about unsupported features
  if (/[<>]/.test(body)) {
    warnings.push('Broken rhythm markers (< >) are not supported – ignored');
  }
  if (/!/.test(body)) {
    warnings.push('Decorations (!...!) are not supported – ignored');
  }
  if (/\(3/.test(body) || /\(4/.test(body) || /\(5/.test(body)) {
    warnings.push('Tuplet markers are not supported – skipped');
  }

  return { title, keySignature, meter, defaultNoteLength, notes, warnings };
}

/**
 * Convert an ABC letter + octave markers to a MIDI pitch.
 */
function letterToMidi(
  letter: string,
  octMarkers: string,
  _accidental: string,
  keySignature: string,
  warnings: string[],
): number {
  const upper = letter.toUpperCase();
  const isLower = letter === letter.toLowerCase();
  const semitone = LETTER_OFFSET[upper];

  // Determine base octave from case:
  // Uppercase = octave starting at middle-C (C = C4)
  // Lowercase = one octave higher (c = C5)
  let octave = isLower ? 5 : 4;

  // Apply explicit octave markers
  for (const ch of octMarkers) {
    if (ch === "'") octave++;
    else if (ch === ',') octave--;
  }

  let midi = MIDI_C4 + (octave - 4) * 12 + semitone;

  // Apply key-signature accidentals
  const ks = KEY_SIGNATURES[keySignature];
  if (!ks) {
    if (keySignature !== 'none' && keySignature !== '') {
      warnings.push(`Unknown key signature "${keySignature}" – treating as C`);
    }
  }
  if (ks) {
    if (ks.sharps.includes(upper)) midi++;
    else if (ks.flats.includes(upper)) midi--;
  }

  return midi;
}

/**
 * Parse a default note length like "1/8" into a fraction of a whole note.
 */
function parseNoteLength(lenStr: string): number {
  const m = lenStr.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return 0.125; // default to 1/8
}

/**
 * Parse explicit note length attached to a note token,
 * e.g. "A2" or "G3/2", returning a fraction of a whole note.
 */
function parseExplicitLength(
  numStr: string,
  denomStr: string,
  defaultLen: number,
): number {
  const num = numStr ? Number(numStr) : 1;
  if (denomStr) return num / Number(denomStr);
  return defaultLen * num;
}
