/** Limited ABC parser for ClawTrad v0.1.1.
 *
 *  Parses a deliberately constrained subset of ABC notation sufficient
 *  for simple monophonic Irish reels and similar tunes. This is NOT a
 *  general-purpose ABC parser.
 *
 *  Capabilities (v0.1.1):
 *  - Single-voice tunes
 *  - Common header fields (X, T, M, L, K)
 *  - Notes with inline accidentals (^ = _), octave markers (', ,), case
 *  - Explicit note lengths
 *  - Bar lines, repeat markers (ignored)
 *  - Key-signature accidental application with explicit override
 *
 *  Detected and warned (not parsed):
 *  - Chords in quotes or brackets
 *  - Grace notes {…}
 *  - Tuplets (3…)
 *  - Decorations !…!
 *  - Multiple voices (V:)
 *  - Broken rhythm markers < >
 *  - Inline key/meter changes
 *  - Ties and slurs
 */

import type { ParsedAbcTune, AbcNote, RhythmEvent } from './types';
import { KEY_SIGNATURES } from './types';

/** MIDI pitch for middle C (C4). */
const MIDI_C4 = 60;

/** Semitone offsets from C for natural note letters. */
const LETTER_OFFSET: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/**
 * Parse an ABC string and return a ParsedAbcTune.
 * Never throws — all problems are reported as warnings.
 */
export function parseAbc(input: string): ParsedAbcTune {
  const warnings: string[] = [];
  let skippedTokens = 0;

  const lines = input.split(/\r?\n/);

  let title = 'Untitled';
  let keySignature = 'D';
  let meter = '4/4';
  let defaultNoteLength = '1/8';

  const headerRE = /^([A-Za-z]):\s*(.*)/;

  // ── extract header fields ──────────────────────────────────
  for (const raw of lines) {
    const m = raw.trim().match(headerRE);
    if (!m) continue;
    const [, field, value] = m;
    switch (field) {
      case 'X':
        break;
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

  // Validate key signature
  if (keySignature && !KEY_SIGNATURES[keySignature]) {
    warnings.push(
      `Key signature "${keySignature}" is not fully supported. ` +
      `Accidentals may be incorrect. Supported keys: C, G, D, A, E, F, Bb, ` +
      `Am, Em, Bm, Dm, Ador, Edor, Ddor, Amix, Dmix.`,
    );
  }

  // ── extract note body ──────────────────────────────────────
  const bodyLines = lines.filter((l) => {
    const t = l.trim();
    return t !== '' && !headerRE.test(t);
  });
  const body = bodyLines.join(' ');

  // ── scan for unsupported features ───────────────────────────
  detectUnsupported(body, warnings);

  // ── tokenise and parse ──────────────────────────────────────
  const notes: AbcNote[] = [];
  const rhythmEvents: RhythmEvent[] = [];
  const defaultLen = parseNoteLength(defaultNoteLength);
  let currentLen = defaultLen;
  let pendingAccidental: string | null = null;

  const tokenRE = buildTokenRegex();
  let match: RegExpExecArray | null;
  while ((match = tokenRE.exec(body)) !== null) {
    const token = match[0];

    // Whitespace
    if (/^\s+$/.test(token)) { skippedTokens++; continue; }

    // Structural symbols — skip
    if (/^[\[\]():]$/.test(token)) { skippedTokens++; continue; }

    // Bar/end/repeat markers — skip but record as barline event
    if (/^\|/.test(token)) {
      skippedTokens++;
      rhythmEvents.push({ kind: 'barline', duration: 0, raw: token });
      continue;
    }

    // Standalone accidentals (apply to next note)
    if (/^\^{1,2}$/.test(token)) { pendingAccidental = token; skippedTokens++; continue; }
    if (/^_{1,2}$/.test(token)) { pendingAccidental = token; skippedTokens++; continue; }
    if (/^=$/.test(token)) { pendingAccidental = token; skippedTokens++; continue; }

    // Grace notes — warn
    if (/^\{/.test(token)) {
      warnings.push('Grace notes are not supported – skipped');
      skippedTokens++; continue;
    }

    // Text/chord annotations — warn
    if (/^"/.test(token) && /"$/.test(token)) {
      warnings.push('Chord annotations are not supported – skipped');
      skippedTokens++; continue;
    }

    // Decorations — warn
    if (/^!/.test(token)) {
      warnings.push('Decorations (!…!) are not supported – skipped');
      skippedTokens++; continue;
    }

    // Broken rhythm
    if (/^[<>]/.test(token)) { continue; }

    // Rest token (z or Z)
    if (/^[zZ]/.test(token)) {
      const restMatch = token.match(/^[zZ]([',]*)(\d*)\/?(\d*)$/);
      let restDur = currentLen;
      if (restMatch) {
        const [, , numStr, denomStr] = restMatch;
        if (numStr || denomStr) {
          restDur = parseExplicitLength(numStr, denomStr, defaultLen);
          currentLen = restDur;
        }
      }
      rhythmEvents.push({ kind: 'rest', duration: restDur, raw: token });
      skippedTokens++; continue;
    }

    // Note token
    const noteMatch = token.match(/^([a-gA-G])([',]*)(\d*)\/?(\d*)$/);
    if (noteMatch) {
      const [, letter, octMark, numStr, denomStr] = noteMatch;
      const accidental = pendingAccidental ?? '';
      pendingAccidental = null;

      const pitch = letterToMidi(letter, octMark, accidental, keySignature);
      let dur = currentLen;
      if (numStr || denomStr) {
        dur = parseExplicitLength(numStr, denomStr, defaultLen);
      }

      notes.push({ pitch, duration: dur, raw: token });
      rhythmEvents.push({ kind: 'note', duration: dur, pitch, raw: token });
      continue;
    }

    // Unknown token
    skippedTokens++;
  }

  return {
    title, keySignature, meter, defaultNoteLength,
    notes, rhythmEvents, warnings, skippedTokens,
  };
}

/**
 * Build a single regex that tokenises the ABC body into:
 *  - standalone accidentals (^, ^^, _, __, =)
 *  - note letters with octave markers and length
 *  - bar/repeat/ending markers
 *  - structural brackets/colons
 *  - whitespace
 *  - grace notes {...}
 *  - quoted strings "..."
 *  - decorations !...!
 *  - broken rhythm markers < >
 */
function buildTokenRegex(): RegExp {
  // Build regex parts using double-quoted strings to avoid
  // escaping issues with single-quote/apostrophe octave markers.
  const parts: string[] = [
    "\\^{1,2}",                          // sharp / double-sharp prefix
    "_{1,2}",                            // flat / double-flat prefix
    "=",                                 // natural prefix
    "[a-gA-GzZ][',]*\\d*/?\\d*",         // note/rest letter + octave markers + length
    "\\|[|\\]:\\[\\]0-9]*",              // bar / repeat / ending markers
    "[\\[\\]\\(\\):]",
    "\\s+",
    "\\{[^}]*\\}",
    "\"[^\"]*\"",
    "![^!]*!",
    "[<>]",
  ];
  return new RegExp(parts.join("|"), "g");
}

/**
 * Detect unsupported ABC features in the body and add warnings.
 */
function detectUnsupported(body: string, warnings: string[]): void {
  if (/[<>]/.test(body)) {
    warnings.push('Broken rhythm markers (< >) are not supported – ignored');
  }
  if (/![^!]*!/.test(body)) {
    warnings.push('Decorations (!…!) are not supported – skipped');
  }
  if (/\(3/.test(body) || /\(4/.test(body) || /\(5/.test(body)) {
    warnings.push('Tuplet markers are not supported – skipped');
  }
  if (/\{[^}]*\}/.test(body)) {
    warnings.push('Grace notes detected – these will be skipped');
  }
  if (/"[^"]*"/.test(body)) {
    warnings.push('Chord annotations or text strings detected – these may not render as expected');
  }
  if (/\[[A-Ga-g][^\]]*\]/.test(body)) {
    warnings.push('Chord brackets [ ] detected – multi-note chords are not supported; only the first note will be used');
  }
  if (/^V:/m.test(body)) {
    warnings.push('Multiple voices (V:) detected – only the first voice is used');
  }
}

/**
 * Convert an ABC letter + octave markers + accidental to a MIDI pitch.
 *
 * Octave logic:
 *   Uppercase letter, no markers → octave 4 (middle-C octave)
 *   Lowercase letter, no markers → octave 5 (one octave higher)
 *   Apostrophe (') → raise one octave
 *   Comma (,) → lower one octave
 *
 * Accidental logic:
 *   ^  → +1 semitone (sharp)
 *   ^^ → +2 semitones (double sharp)
 *   _  → −1 semitone (flat)
 *   __ → −2 semitones (double flat)
 *   =  → natural (cancel key-signature accidental for this note)
 *   "" → apply key-signature accidental if applicable
 */
function letterToMidi(
  letter: string,
  octMarkers: string,
  accidental: string,
  keySignature: string,
): number {
  const upper = letter.toUpperCase();
  const isLower = letter === letter.toLowerCase();
  const baseSemitone = LETTER_OFFSET[upper];

  // Determine base octave from case
  let octave = isLower ? 5 : 4;

  // Apply explicit octave markers
  for (const ch of octMarkers) {
    if (ch === "'") octave++;
    else if (ch === ',') octave--;
  }

  let midi = MIDI_C4 + (octave - 4) * 12 + baseSemitone;

  // Apply accidental
  if (!accidental) {
    // No explicit accidental — apply key signature
    const ks = KEY_SIGNATURES[keySignature];
    if (ks) {
      if (ks.sharps.includes(upper)) midi++;
      else if (ks.flats.includes(upper)) midi--;
    }
  } else {
    // Explicit accidental overrides key signature
    switch (accidental) {
      case '^':  midi++;      break;
      case '^^': midi += 2;   break;
      case '_':  midi--;      break;
      case '__': midi -= 2;   break;
      case '=':  /* natural — cancel key-sig, leave at base */ break;
    }
  }

  return midi;
}

/** Parse a default note length like "1/8" into a fraction of a whole note. */
function parseNoteLength(lenStr: string): number {
  const m = lenStr.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return 0.125; // default to 1/8
}

/**
 * Parse explicit note length from num and optional denom strings.
 * e.g. ("2", "") → 2 × defaultLen; ("3", "2") → 3/2.
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
