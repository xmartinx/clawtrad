/** Position scoring for melody-to-tab arrangement — v0.2.4.
 *
 *  Priorities:
 *    1. Prefer middle strings (2–4) for natural banjo placement
 *    2. Prefer lower frets
 *    3. Prefer open strings where musically useful
 *    4. Avoid large jumps from previous position
 *    5. Strongly avoid using string 1 unless needed
 *    6. 5th string is banned from melody entirely (enforced by fretboard)
 *
 *  v0.2.4: Octave-lower candidates carry `originalPitch` so the
 *  arranger can emit a diagnostic when the lower octave was preferred.
 */

import type { FretPosition } from '../banjo/fretboard';

/* ── Scoring weights ──────────────────────────────────────── */

const WEIGHTS = {
  /** Bonus per fret below 10 (so lower frets score higher). */
  lowFret: 3,
  /** Bonus for open strings (fret 0). */
  openString: 4,
  /** Bonus for playing on middle melody strings (2–4). */
  middleString: 6,
  /** Penalty for using string 1 (too high/ringy for melody). */
  string1Penalty: -8,
  /** Penalty per fret of jump from previous position. */
  jumpPenaltyPerFret: -2,
  /** Penalty per string of jump from previous position. */
  jumpPenaltyPerString: -2,
  /** Bonus for staying on same string. */
  sameString: 3,
  /** Bonus for octave-lower placement (more natural banjo range). */
  octaveLower: 4,
} as const;

/* ── Intrinsic position score (higher = better) ──────────── */

export function intrinsicScore(pos: FretPosition): number {
  let score = 0;

  // Prefer lower frets (scale to max 10)
  score += (10 - pos.fret) * WEIGHTS.lowFret;

  // Bonus for open strings
  if (pos.fret === 0) {
    score += WEIGHTS.openString;
  }

  // Prefer middle strings (2–4) for natural banjo melody placement
  if (pos.string >= 2 && pos.string <= 4) {
    score += WEIGHTS.middleString;
  }

  // Penalty for string 1 — keep melody off the top string unless needed
  if (pos.string === 1) {
    score += WEIGHTS.string1Penalty;
  }

  // Bonus for octave-lower placement
  if (pos.originalPitch !== undefined && pos.pitch < pos.originalPitch) {
    score += WEIGHTS.octaveLower;
  }

  return score;
}

/* ── Transition score (higher = better, i.e. less penalty) ── */

export function transitionScore(prev: FretPosition, curr: FretPosition): number {
  const fretJump = Math.abs(curr.fret - prev.fret);
  const stringJump = Math.abs(curr.string - prev.string);
  let score = 0;

  score += fretJump * WEIGHTS.jumpPenaltyPerFret;
  score += stringJump * WEIGHTS.jumpPenaltyPerString;

  if (curr.string === prev.string) {
    score += WEIGHTS.sameString;
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

/* ── Greedy selection (kept for reference) ────────────────── */

export function selectBestPosition(
  candidates: FretPosition[],
  prev: FretPosition | null,
): FretPosition | null {
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestScore = scorePosition(best, prev);

  for (let i = 1; i < candidates.length; i++) {
    const s = scorePosition(candidates[i], prev);
    if (s > bestScore) {
      bestScore = s;
      best = candidates[i];
    }
  }

  return best;
}

/* ── Dynamic-programming global-path optimisation ────────── */

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

  let segmentStart = 0;
  while (segmentStart < N) {
    while (segmentStart < N && candidateGroups[segmentStart].length === 0) {
      unplayableIndices.push(segmentStart);
      path[segmentStart] = null;
      segmentStart++;
    }
    if (segmentStart >= N) break;

    let segmentEnd = segmentStart + 1;
    while (segmentEnd < N && candidateGroups[segmentEnd].length > 0) {
      segmentEnd++;
    }

    const segment = candidateGroups.slice(segmentStart, segmentEnd);
    const segResult = dpSegment(segment);
    for (let i = 0; i < segResult.length; i++) {
      path[segmentStart + i] = segResult[i];
    }
    totalCost += computeSegmentCost(segResult);

    segmentStart = segmentEnd;
  }

  return { path, unplayableIndices, totalCost };
}

/* ── DP internals ──────────────────────────────────────────── */

function localCost(pos: FretPosition): number {
  return -intrinsicScore(pos);
}

function transitionCost(prev: FretPosition, curr: FretPosition): number {
  return -transitionScore(prev, curr);
}

function dpSegment(segment: FretPosition[][]): FretPosition[] {
  const M = segment.length;
  if (M === 0) return [];

  const dp: number[][] = [];
  const prev: (number | null)[][] = [];

  dp[0] = [];
  prev[0] = [];
  const cand0 = segment[0];
  for (let k = 0; k < cand0.length; k++) {
    dp[0][k] = localCost(cand0[k]);
    prev[0][k] = null;
  }

  for (let i = 1; i < M; i++) {
    const candI = segment[i];
    dp[i] = new Array(candI.length);
    prev[i] = new Array(candI.length);

    for (let k = 0; k < candI.length; k++) {
      const posK = candI[k];
      let bestCost = Infinity;
      let bestPred: number | null = null;

      for (let j = 0; j < segment[i - 1].length; j++) {
        const cost = dp[i - 1][j] + transitionCost(segment[i - 1][j], posK);
        if (cost < bestCost) {
          bestCost = cost;
          bestPred = j;
        }
      }

      dp[i][k] = bestCost + localCost(posK);
      prev[i][k] = bestPred;
    }
  }

  const path: FretPosition[] = new Array(M);
  let bestLast = 0;
  let bestLastCost = dp[M - 1][0];
  for (let k = 1; k < dp[M - 1].length; k++) {
    if (dp[M - 1][k] < bestLastCost) {
      bestLastCost = dp[M - 1][k];
      bestLast = k;
    }
  }

  path[M - 1] = segment[M - 1][bestLast];
  for (let i = M - 2; i >= 0; i--) {
    const predIdx = prev[i + 1][bestLast];
    if (predIdx === null) {
      path[i] = segment[i][0];
    } else {
      path[i] = segment[i][predIdx];
      bestLast = predIdx;
    }
  }

  return path;
}

function computeSegmentCost(path: FretPosition[]): number {
  let cost = 0;
  for (let i = 0; i < path.length; i++) {
    cost += localCost(path[i]);
    if (i > 0) {
      cost += transitionCost(path[i - 1], path[i]);
    }
  }
  return cost;
}
