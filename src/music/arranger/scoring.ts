/** Position scoring for melody-to-tab arrangement.
 *
 *  v0.1.1: Adds dynamic-programming global-path optimisation alongside
 *  the original greedy selector. The scoring model is split into
 *  intrinsic position merit and transition cost so both algorithms
 *  share the same weights.
 *
 *  Priorities (see MUSIC_ENGINE_NOTES.md):
 *    1. Prefer lower frets
 *    2. Prefer open strings where musically useful
 *    3. Avoid large jumps from previous position
 *    4. Prefer strings 1–3 for melody
 *    5. Avoid using the 5th string as normal melody
 *    6. Prefer positions that allow simple clawhammer right-hand flow
 */

import type { FretPosition } from '../banjo/fretboard';

/* ── Scoring weights ──────────────────────────────────────── */

const WEIGHTS = {
  /** Bonus per fret below MAX_FRET (so lower frets score higher). */
  lowFret: 3,
  /** Bonus for open strings (fret 0). */
  openString: 4,
  /** Bonus for playing on melody strings (1–3). */
  melodyString: 5,
  /** Penalty for using 5th string as melody. */
  fifthStringPenalty: -20,
  /** Penalty per fret of jump from previous position. */
  jumpPenaltyPerFret: -2,
  /** Penalty per string of jump from previous position. */
  jumpPenaltyPerString: -1,
  /** Bonus for staying on same string. */
  sameString: 2,
} as const;

/* ── Intrinsic position score (higher = better) ──────────── */

/**
 * Compute the *intrinsic* score of a position — how good it is
 * regardless of what came before.  Higher is better.
 */
export function intrinsicScore(pos: FretPosition): number {
  let score = 0;

  // Prefer lower frets
  score += (7 - pos.fret) * WEIGHTS.lowFret;

  // Bonus for open strings
  if (pos.fret === 0) {
    score += WEIGHTS.openString;
  }

  // Prefer melody strings (1–3)
  if (pos.string >= 1 && pos.string <= 3) {
    score += WEIGHTS.melodyString;
  }

  // Penalty for using 5th string as melody
  if (pos.string === 5) {
    score += WEIGHTS.fifthStringPenalty;
  }

  return score;
}

/* ── Transition score (higher = better, i.e. less penalty) ── */

/**
 * Score for moving from `prev` to `curr`.
 * Higher is better (negative values represent a cost).
 */
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

/* ── Combined score (intrinsic + transition) ─────────────── */

/**
 * Score a single candidate position for a note, including transition
 * from a previous position.
 *
 * `prev` can be null for the first note in the sequence.
 *
 * This is the original greedy-scoring entry point, kept for
 * backward compatibility and for use as a fallback.
 */
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

/* ── Greedy selection (original, kept for reference) ─────── */

/**
 * Select the best position from a list of candidates, given the
 * previous position (or null for the first note).
 *
 * This is a greedy local choice — it does NOT consider the global
 * optimum.  For most use-cases prefer {@link findOptimalPath}.
 */
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

/**
 * Result of the global-path arrangement algorithm.
 */
export interface DpResult {
  /** Optimal positions for each note (same length as candidateGroups). */
  path: (FretPosition | null)[];
  /** Indices of notes that had no playable candidates. */
  unplayableIndices: number[];
  /** Total cost of the path (lower = better). */
  totalCost: number;
}

/**
 * Find the globally optimal (minimum-cost) path through a sequence of
 * candidate position groups using a Viterbi-style dynamic programming
 * algorithm.
 *
 * The cost model minimises:
 *   localCost(pos) = -intrinsicScore(pos)    [lower is better]
 *   transitionCost(prev, curr) = -transitionScore(prev, curr)
 *
 * Unplayable notes (empty candidate sets) produce a null in the path
 * slot and are counted in `unplayableIndices`.  They break the
 * transition chain so the DP restarts fresh after each gap.
 *
 * Complexity: O(N × K²) where N = notes, K = max candidates per note.
 * For our domain (K ≤ 5, N typically < 200) this is negligible.
 */
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
    // Skip unplayable notes at the start of a segment
    while (segmentStart < N && candidateGroups[segmentStart].length === 0) {
      unplayableIndices.push(segmentStart);
      path[segmentStart] = null;
      segmentStart++;
    }
    if (segmentStart >= N) break;

    // Find the end of this playable segment
    let segmentEnd = segmentStart + 1;
    while (segmentEnd < N && candidateGroups[segmentEnd].length > 0) {
      segmentEnd++;
    }

    // Run DP on this contiguous segment
    const segment = candidateGroups.slice(segmentStart, segmentEnd);
    const segResult = dpSegment(segment);
    for (let i = 0; i < segResult.length; i++) {
      path[segmentStart + i] = segResult[i];
    }
    totalCost += computeSegmentCost(segResult);

    // Move to the next segment
    segmentStart = segmentEnd;
    // The gap note(s) are handled at the top of the loop
  }

  return { path, unplayableIndices, totalCost };
}

/**
 * Compute the local cost of a position.
 * Lower is better.  This is simply -intrinsicScore so the DP
 * finds a minimum-cost path.
 */
function localCost(pos: FretPosition): number {
  return -intrinsicScore(pos);
}

/**
 * Compute the transition cost from prev to curr.
 * Lower is better.
 */
function transitionCost(prev: FretPosition, curr: FretPosition): number {
  return -transitionScore(prev, curr);
}

/**
 * Run DP on a contiguous segment where every note has ≥1 candidate.
 * Returns the optimal position for each note in the segment.
 */
function dpSegment(segment: FretPosition[][]): FretPosition[] {
  const M = segment.length;
  if (M === 0) return [];

  // dp[i][k] = minimum cost to reach note i at candidate k
  // prev[i][k] = index of best predecessor for note i at candidate k
  const dp: number[][] = [];
  const prev: (number | null)[][] = [];

  // ── initialise first note ──
  dp[0] = [];
  prev[0] = [];
  const cand0 = segment[0];
  for (let k = 0; k < cand0.length; k++) {
    dp[0][k] = localCost(cand0[k]);
    prev[0][k] = null; // no predecessor
  }

  // ── fill DP table ──
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

  // ── backtrack ──
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
      // Shouldn't happen in a contiguous segment, but guard anyway
      path[i] = segment[i][0];
    } else {
      path[i] = segment[i][predIdx];
      bestLast = predIdx;
    }
  }

  return path;
}

/** Compute the total cost of a path. */
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
