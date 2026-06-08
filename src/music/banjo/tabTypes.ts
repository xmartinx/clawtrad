/** Types for banjo tab output. */

/** A single cell in a tab staff — a fret number on a string. */
export interface TabCell {
  string: number;  // 1–5
  fret: number;    // 0 = open, -1 = unused/muted
}

/** A vertical slice of tab: one time-step across all 5 strings. */
export interface TabColumn {
  cells: TabCell[];          // one per string (5)
  duration: number;          // fraction of whole note
  hasDrone: boolean;         // 5th-string drone marker
  isRest: boolean;           // true if no melody note this step
}

/** Output modes for the arrange engine. */
export type OutputMode = 'melody-only' | 'basic-clawhammer';

/** A complete tab arrangement. */
export interface TabArrangement {
  title: string;
  tuning: string;
  mode: OutputMode;
  columns: TabColumn[];
  warnings: string[];
}
