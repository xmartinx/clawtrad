/** Tab document model for ClawTrad v0.2.
 *
 *  A TabDocument is a pure-data representation of a banjo tab
 *  arrangement, including rhythmic structure (notes, rests, barlines).
 *  It is not tied to any specific rendering technology — SVG, HTML,
 *  plain-text, and future PDF export all consume this model.
 */

/** Top-level tab document. */
export interface TabDocument {
  title: string;
  key: string;
  meter: string;
  tuningId: string;       // e.g. "gDGBD"
  tuningLabel: string;    // e.g. "Open G"
  mode: 'melody-only' | 'basic-clawhammer';
  measures: TabMeasure[];
  warnings: string[];
  diagnostics: TabDiagnostics;
}

export interface TabDiagnostics {
  noteCount: number;
  restCount: number;
  unplayableCount: number;
  measureCount: number;
}

/** A single measure/bar in the tab. */
export interface TabMeasure {
  /** Zero-based measure index. */
  index: number;
  events: TabEvent[];
}

/** The kind of event occupying a rhythmic slot in the tab. */
export type TabEventKind = 'note' | 'rest' | 'drone' | 'skipped';

/** A single rhythmic event in a tab measure. */
export interface TabEvent {
  kind: TabEventKind;
  /** Duration as a fraction of a whole note. */
  duration: number;
  /** Cumulative beat position within the measure (0-based). */
  beatPosition: number;
  /** String index (0–4, where 0 = string 1). Only for note/drone events. */
  stringIndex?: number;
  /** Fret number (0 = open). Only for note/drone events. */
  fret?: number;
  /** Human label, e.g. "z" for rest, "x" for skipped. */
  label?: string;
  /** MIDI pitch of the source melody note, if applicable. */
  sourcePitch?: number;
  /** Chord symbol label (e.g. "D", "Em") for display above the note. */
  chordLabel?: string;
  /** Optional warning for this specific event. */
  warning?: string;
}
