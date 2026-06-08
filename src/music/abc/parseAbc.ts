/** Limited ABC parser for ClawTrad v0.2.2.
 *
 *  Parses a deliberately constrained subset of ABC notation sufficient
 *  for simple monophonic Irish reels and similar tunes. This is NOT a
 *  general-purpose ABC parser.
 *
 *  v0.2.2 improvements:
 *  - Tolerates common ABC headers beyond the core set
 *  - Strips comments (% …)
 *  - Handles line continuations (trailing \)
 *  - Skips slurs/ties () and - around notes
 *  - Ignores first/second-time endings [1 [2
 *  - Handles +decorations+
 *  - Improved, deduplicated, specific warning messages
 *  - Richer parse diagnostics
 *  - Missing headers fall back gracefully with warnings
 */

import type {
  ParsedAbcTune, AbcNote, RhythmEvent, ParseDiagnostics,
} from './types';
import { KEY_SIGNATURES } from './types';

/* ── Constants ─────────────────────────────────────────────── */

const MIDI_C4 = 60;

const LETTER_OFFSET: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** Standard ABC headers recognised by ClawTrad. */
const KNOWN_HEADERS = new Set([
  'A', 'B', 'C', 'D', 'F', 'G', 'H', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Z',
]);

/* ── Main entry point ──────────────────────────────────────── */

/**
 * Parse an ABC string and return a ParsedAbcTune.
 * Never throws — all problems are reported as warnings.
 */
export function parseAbc(input: string): ParsedAbcTune {
  const warnings: string[] = [];
  const seenWarnings = new Set<string>();
  let skippedTokens = 0;

  // ── preprocess ──────────────────────────────────────────────
  const rawLines = input.split(/\r?\n/);
  const { headerLines, bodyLines } = splitHeaderBody(rawLines);

  // Scan raw body for +decorations+ before + stripping
  const rawBody = bodyLines.join(' ');
  if (/\+[a-zA-Z]+\+/.test(rawBody)) {
    addWarning('Decorations (!…! or +…+) were ignored in this version.');
  }

  const body = preprocessBody(bodyLines);

  // ── header parsing ──────────────────────────────────────────
  const {
    title, alternateTitles, keySignature, meter, defaultNoteLength,
    otherHeaders, headerCount,
    keyWasMissing, meterWasMissing, lengthWasMissing,
  } = parseHeaders(headerLines, addWarning);

  // ── unsupported feature scan ────────────────────────────────
  const unsupportedFeatures = detectUnsupported(body, addWarning);

  // ── tokenise and parse notes ────────────────────────────────
  const notes: AbcNote[] = [];
  const rhythmEvents: RhythmEvent[] = [];
  const defaultLen = parseNoteLength(defaultNoteLength);
  let currentLen = defaultLen;
  let pendingAccidental: string | null = null;
  let barlineCount = 0;

  const tokenRE = buildTokenRegex();
  let match: RegExpExecArray | null;
  while ((match = tokenRE.exec(body)) !== null) {
    const token = match[0];

    // Whitespace
    if (/^\s+$/.test(token)) { skippedTokens++; continue; }

    // Bare brackets, parens, colons — skip
    if (/^[\[\]():]$/.test(token)) { skippedTokens++; continue; }

    // Bar lines / repeat markers
    if (/^\|/.test(token)) {
      skippedTokens++;
      barlineCount++;
      rhythmEvents.push({ kind: 'barline', duration: 0, raw: token });
      continue;
    }

    // Stray repeat dots / colons
    if (/^:/.test(token)) { skippedTokens++; continue; }

    // Standalone accidentals (apply to next note)
    if (/^\^{1,2}$/.test(token)) { pendingAccidental = token; skippedTokens++; continue; }
    if (/^_{1,2}$/.test(token)) { pendingAccidental = token; skippedTokens++; continue; }
    if (/^=$/.test(token)) { pendingAccidental = token; skippedTokens++; continue; }

    // Grace notes
    if (/^\{/.test(token)) {
      addWarning('Grace notes were ignored in this version.');
      skippedTokens++; continue;
    }

    // Chord / text annotations in quotes
    if (/^"/.test(token) && /"$/.test(token)) {
      addWarning('Chord symbols were ignored: tab is generated from melody only.');
      skippedTokens++; continue;
    }

    // Decorations !…!
    if (/^!/.test(token)) {
      addWarning('Decorations (!…!) were ignored in this version.');
      skippedTokens++; continue;
    }

    // Broken rhythm markers
    if (/^[<>]/.test(token)) { skippedTokens++; continue; }

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

  // ── diagnostics ─────────────────────────────────────────────
  const parseDiagnostics: ParseDiagnostics = {
    headerCount,
    bodyLineCount: bodyLines.length,
    barlineCount,
    unsupportedFeatures,
    keyWasMissing,
    meterWasMissing,
    lengthWasMissing,
  };

  return {
    title, alternateTitles, keySignature, meter, defaultNoteLength,
    otherHeaders, notes, rhythmEvents, warnings, skippedTokens,
    parseDiagnostics,
  };

  /* ── helpers ───────────────────────────────────────────────── */
  function addWarning(msg: string): void {
    if (!seenWarnings.has(msg)) {
      seenWarnings.add(msg);
      warnings.push(msg);
    }
  }
}

/* ── Header parsing ─────────────────────────────────────────── */

interface HeaderResult {
  title: string;
  alternateTitles: string[];
  keySignature: string;
  meter: string;
  defaultNoteLength: string;
  otherHeaders: Record<string, string>;
  headerCount: number;
  keyWasMissing: boolean;
  meterWasMissing: boolean;
  lengthWasMissing: boolean;
}

function parseHeaders(
  headerLines: string[],
  addWarning: (msg: string) => void,
): HeaderResult {
  let title = 'Untitled';
  const alternateTitles: string[] = [];
  let keySignature = '';
  let meter = '';
  let defaultNoteLength = '';
  const otherHeaders: Record<string, string> = {};
  let hasK = false, hasM = false, hasL = false;
  let headerCount = 0;

  // header: letter, colon, then optional whitespace and the value
  const headerRE = /^([A-Za-z]):\s*(.*)/;

  for (const raw of headerLines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(headerRE);
    if (!m) continue;
    const [, field, value] = m;
    headerCount++;

    if (!KNOWN_HEADERS.has(field) && field.length === 1) {
      // Unknown but valid-format header — store it
      otherHeaders[field] = value.trim();
      continue;
    }

    switch (field) {
      case 'X':
        otherHeaders['X'] = value.trim();
        break;
      case 'T':
        if (title === 'Untitled') {
          title = value.trim();
        } else {
          alternateTitles.push(value.trim());
        }
        break;
      case 'M':
        meter = value.trim();
        hasM = true;
        break;
      case 'L':
        defaultNoteLength = value.trim();
        hasL = true;
        break;
      case 'K':
        keySignature = value.trim();
        hasK = true;
        break;
      case 'C':
      case 'S':
      case 'R':
      case 'Z':
      case 'N':
      case 'A':
      case 'O':
      case 'P':
      case 'Q':
      case 'B':
      case 'D':
      case 'F':
      case 'G':
      case 'H':
      case 'W':
        otherHeaders[field] = value.trim();
        break;
    }
  }

  // ── fallbacks for missing fields ────────────────────────────
  let keyWasMissing = false, meterWasMissing = false, lengthWasMissing = false;

  if (!hasK || !keySignature) {
    keySignature = 'C';
    keyWasMissing = true;
    addWarning('Missing key signature (K:); assuming C major.');
  }
  if (!hasM || !meter) {
    meter = '4/4';
    meterWasMissing = true;
    addWarning('Missing meter (M:); assuming 4/4.');
  }
  if (!hasL || !defaultNoteLength) {
    defaultNoteLength = '1/8';
    lengthWasMissing = true;
    addWarning('Missing default note length (L:); assuming 1/8.');
  }

  // Validate key signature
  if (!KEY_SIGNATURES[keySignature]) {
    addWarning(
      `Key signature "${keySignature}" is not fully supported. ` +
      `Accidentals may be incorrect. Supported: C, G, D, A, E, F, Bb, ` +
      `Am, Em, Bm, Dm, Ador, Edor, Ddor, Amix, Dmix.`,
    );
  }

  return {
    title, alternateTitles, keySignature, meter, defaultNoteLength,
    otherHeaders, headerCount,
    keyWasMissing, meterWasMissing, lengthWasMissing,
  };
}

/* ── Body preprocessing ─────────────────────────────────────── */

/**
 * Preprocess the ABC body: join continued lines, strip comments,
 * remove slurs, ties, and unsupported markup.
 */
function preprocessBody(bodyLines: string[]): string {
  // Join all body lines, handling trailing backslash continuations
  let joined = '';
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Strip full-line comments
    if (trimmed.startsWith('%')) continue;
    // Strip inline comments (but not within quotes — simplified)
    const commentIdx = findCommentIndex(trimmed);
    const clean = commentIdx >= 0 ? trimmed.slice(0, commentIdx).trim() : trimmed;
    if (!clean) continue;
    // Handle line continuation: trailing backslash
    if (clean.endsWith('\\')) {
      joined += clean.slice(0, -1).trimEnd() + ' ';
    } else {
      joined += clean + ' ';
    }
  }

  // Strip slurs/ties: remove parentheses used for grouping/slurs
  // but keep the notes inside.  E.g. "(3abc" is a tuplet → handled later.
  // Remove bare '(' and ')' that surround notes.
  // We do a simple pass: remove '(' and ')' when not part of a tuplet number.
  let result = joined
    .replace(/\(\s*(?=[a-gA-GzZ^_=])/g, '')  // ( before a note
    .replace(/(?<=[a-gA-GzZ0-9'/,])\s*\)/g, '')  // ) after a note
    .replace(/-/g, ' ')                              // tie hyphens → space
    .replace(/\+/g, '')                              // +decoration+ delimiters
    .replace(/\[[12]\b/g, '')                        // first/second endings [1 [2
    .replace(/\s+/g, ' ')                            // normalise whitespace
    .trim();

  return result;
}

/** Find the index of the first '%' comment that is not inside quotes. */
function findCommentIndex(line: string): number {
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    if (line[i] === '%' && !inQuotes) return i;
  }
  return -1;
}

/* ── Header / body split ────────────────────────────────────── */

function splitHeaderBody(
  lines: string[],
): { headerLines: string[]; bodyLines: string[] } {
  const headerLines: string[] = [];
  const bodyLines: string[] = [];
  let inBody = false;
  const headerRE = /^([A-Za-z]):\s*./;  // letter: optionally space + content

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inBody && headerRE.test(trimmed)) {
      headerLines.push(line);
    } else if (!inBody && trimmed === '') {
      // blank line before body — skip
      continue;
    } else {
      inBody = true;
      bodyLines.push(line);
    }
  }

  return { headerLines, bodyLines };
}

/* ── Feature detection ──────────────────────────────────────── */

/**
 * Scan the preprocessed body for unsupported features and emit
 * one deduplicated warning per category.  Returns the list of
 * detected unsupported feature categories.
 */
function detectUnsupported(
  body: string,
  addWarning: (msg: string) => void,
): string[] {
  const found: string[] = [];

  if (/[<>]/.test(body)) {
    found.push('broken-rhythm');
    addWarning('Broken rhythm markers (< >) were detected but simplified.');
  }
  if (/![^!]*!/.test(body)) {
    found.push('decorations');
    addWarning('Decorations (!…!) were ignored in this version.');
  }
  if (/\(3/.test(body) || /\(4/.test(body) || /\(5/.test(body)) {
    found.push('tuplets');
    addWarning('Tuplets were detected but simplified.');
  }
  if (/\{[^}]*\}/.test(body)) {
    found.push('grace-notes');
    addWarning('Grace notes were ignored in this version.');
  }
  if (/"[^"]*"/.test(body)) {
    found.push('chord-symbols');
    addWarning('Chord symbols were ignored: tab is generated from melody only.');
  }
  if (/\[[A-Ga-g][^\]]*\]/.test(body)) {
    found.push('chord-brackets');
    addWarning('Chord brackets [ ] were detected: only single melody notes are used.');
  }
  if (/^V:/m.test(body)) {
    found.push('multi-voice');
    addWarning('Multiple voices were detected: only the first voice is used.');
  }

  return found;
}

/* ── Tokeniser ──────────────────────────────────────────────── */

function buildTokenRegex(): RegExp {
  const parts: string[] = [
    "\\^{1,2}",
    "_{1,2}",
    "=",
    "[a-gA-GzZ][',]*\\d*/?\\d*",
    "\\|[|\\]:\\[\\]0-9]*",
    "[\\[\\]\\(\\):]",
    "\\s+",
    "\\{[^}]*\\}",
    "\"[^\"]*\"",
    "![^!]*!",
    "[<>]",
  ];
  return new RegExp(parts.join("|"), "g");
}

/* ── Pitch conversion ───────────────────────────────────────── */

function letterToMidi(
  letter: string,
  octMarkers: string,
  accidental: string,
  keySignature: string,
): number {
  const upper = letter.toUpperCase();
  const isLower = letter === letter.toLowerCase();
  const baseSemitone = LETTER_OFFSET[upper];

  let octave = isLower ? 5 : 4;
  for (const ch of octMarkers) {
    if (ch === "'") octave++;
    else if (ch === ',') octave--;
  }

  let midi = MIDI_C4 + (octave - 4) * 12 + baseSemitone;

  if (!accidental) {
    const ks = KEY_SIGNATURES[keySignature];
    if (ks) {
      if (ks.sharps.includes(upper)) midi++;
      else if (ks.flats.includes(upper)) midi--;
    }
  } else {
    switch (accidental) {
      case '^':  midi++;      break;
      case '^^': midi += 2;   break;
      case '_':  midi--;      break;
      case '__': midi -= 2;   break;
      case '=':  break;       // natural — cancel key-sig
    }
  }

  return midi;
}

/* ── Duration helpers ───────────────────────────────────────── */

function parseNoteLength(lenStr: string): number {
  const m = lenStr.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return 0.125; // default to 1/8
}

function parseExplicitLength(
  numStr: string, denomStr: string, defaultLen: number,
): number {
  const num = numStr ? Number(numStr) : 1;
  if (denomStr) return num / Number(denomStr);
  return defaultLen * num;
}
