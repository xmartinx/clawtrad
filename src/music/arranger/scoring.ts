/** Position scoring for melody-to-tab arrangement — v0.2.5.
 *
 *  Priorities (ordered):
 *    1. Prefer open strings where musically sensible
 *    2. Prefer lower frets
 *    3. Penalise large fret jumps (>3 frets) and quick back-and-forth
 *    4. Weak middle-string preference (do not force melody off open strings)
 *    5. 5th string is banned from melody entirely (enforced by fretboard)
 */

import type { FretPosition } from '../banjo/fretboard';

/* ── Scoring weights ──────────────────────────────────────── */

const WEIGHTS = {
  /** Bonus per fret below 10. */
  lowFret: 3,
  /** Bonus for open strings (fret 0). */
  openString: 6,
  /** Weak bonus for middle strings (2–4). */
  middleString: 2,
  /** Mild penalty for string 1. */
  string1Penalty: -3,
  /** Penalty per fret of jump. */
  jumpPenaltyPerFret: -3,
  /** Extra penalty for jumps > 3 frets. */
  largeJumpPenalty: -6,
  /** Penalty per string of jump. */
  jumpPenaltyPerString: -2,
  /** Bonus for staying on same string. */
  sameString: 3,
  /** Extra bonus for same-string moves ≤ 3 frets (H/P/Sl candidates).
   *  Must be strong enough to overcome open-string attraction for
   *  second-slot melody notes (e.g. c→d on string 2 vs open string 1). */
  sameStringClose: 8,
} as const;

/* ── Intrinsic position score (higher = better) ──────────── */

export function intrinsicScore(pos: FretPosition): number {
  let score = 0;

  // Prefer lower frets
  score += (10 - pos.fret) * WEIGHTS.lowFret;

  // Strong bonus for open strings
  if (pos.fret === 0) {
    score += WEIGHTS.openString;
  }

  // Weak bonus for middle strings (2–4)
  if (pos.string >= 2 && pos.string <= 4) {
    score += WEIGHTS.middleString;
  }

  // Mild penalty for string 1
  if (pos.string === 1) {
    score += WEIGHTS.string1Penalty;
  }

  return score;
}

/* ── Transition score (higher = better) ───────────────────── */

export function transitionScore(prev: FretPosition, curr: FretPosition): number {
  const fretJump = Math.abs(curr.fret - prev.fret);
  const stringJump = Math.abs(curr.string - prev.string);
  let score = 0;

  score += fretJump * WEIGHTS.jumpPenaltyPerFret;

  // Extra penalty for large fret jumps
  if (fretJump > 3) {
    score += WEIGHTS.largeJumpPenalty;
  }

  score += stringJump * WEIGHTS.jumpPenaltyPerString;

  if (curr.string === prev.string) {
    score += WEIGHTS.sameString;
    // Extra bonus for close same-string moves (H/P/Sl candidates)
    if (fretJump >= 1 && fretJump <= 3) {
      score += WEIGHTS.sameStringClose;
    }
  }

  return score;
}

/* ── Combined score ───────────────────────────────────────── */

export function scorePosition(
  pos: FretPosition,
  prev: FretPosition | null,
): number {
  let score = intrinsicScore(pos);
  if (prev) {
    score += transitionScore(prev, pos);
  }
  return score;
}

/* ── Greedy selection ─────────────────────────────────────── */

export function selectBestPosition(
  candidates: FretPosition[],
  prev: FretPosition | null,
): FretPosition | null {
  if (candidates.length === 0) return null;
  let best = candidates[0];
  let bestScore = scorePosition(best, prev);
  for (let i = 1; i < candidates.length; i++) {
    const s = scorePosition(candidates[i], prev);
    if (s > bestScore) { bestScore = s; best = candidates[i]; }
  }
  return best;
}

/* ── Dynamic-programming ──────────────────────────────────── */

export interface DpResult {
  path: (FretPosition | null)[];
  unplayableIndices: number[];
  totalCost: number;
}

export function findOptimalPath(
  candidateGroups: FretPosition[][],
): DpResult {
  const N = candidateGroups.length;
  if (N === 0) return { path: [], unplayableIndices: [], totalCost: 0 };

  const path: (FretPosition | null)[] = new Array(N).fill(null);
  const unplayableIndices: number[] = [];
  let totalCost = 0;

  let segStart = 0;
  while (segStart < N) {
    while (segStart < N && candidateGroups[segStart].length === 0) {
      unplayableIndices.push(segStart);
      path[segStart] = null;
      segStart++;
    }
    if (segStart >= N) break;

    let segEnd = segStart + 1;
    while (segEnd < N && candidateGroups[segEnd].length > 0) segEnd++;

    const seg = candidateGroups.slice(segStart, segEnd);
    const segPath = dpSegment(seg);
    for (let i = 0; i < segPath.length; i++) path[segStart + i] = segPath[i];
    totalCost += pathCost(segPath);

    segStart = segEnd;
  }

  return { path, unplayableIndices, totalCost };
}

function localCost(pos: FretPosition): number { return -intrinsicScore(pos); }
function transCost(a: FretPosition, b: FretPosition): number { return -transitionScore(a, b); }

function dpSegment(segment: FretPosition[][]): FretPosition[] {
  const M = segment.length;
  if (M === 0) return [];

  const dp: number[][] = [];
  const prev: (number | null)[][] = [];

  dp[0] = segment[0].map((c) => localCost(c));
  prev[0] = segment[0].map(() => null);

  for (let i = 1; i < M; i++) {
    dp[i] = [];
    prev[i] = [];
    for (let k = 0; k < segment[i].length; k++) {
      let best = Infinity;
      let bestJ: number | null = null;
      for (let j = 0; j < segment[i - 1].length; j++) {
        const c = dp[i - 1][j] + transCost(segment[i - 1][j], segment[i][k]);
        if (c < best) { best = c; bestJ = j; }
      }
      dp[i][k] = best + localCost(segment[i][k]);
      prev[i][k] = bestJ;
    }
  }

  const result: FretPosition[] = new Array(M);
  let bestLast = 0;
  for (let k = 1; k < dp[M - 1].length; k++) {
    if (dp[M - 1][k] < dp[M - 1][bestLast]) bestLast = k;
  }
  result[M - 1] = segment[M - 1][bestLast];
  for (let i = M - 2; i >= 0; i--) {
    const p = prev[i + 1][bestLast];
    result[i] = segment[i][p ?? 0];
    bestLast = p ?? 0;
  }
  return result;
}

function pathCost(path: FretPosition[]): number {
  let c = 0;
  for (let i = 0; i < path.length; i++) {
    c += localCost(path[i]);
    if (i > 0) c += transCost(path[i - 1], path[i]);
  }
  return c;
}
