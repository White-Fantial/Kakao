// Pure functions and constants for community score — no DB dependencies.
// This file is importable from test files without Next.js aliases.

// ─── Thresholds ──────────────────────────────────────────────────────────────

export const COMMUNITY_SCORE_POST_AUTO_HOLD_THRESHOLD = -8;
export const COMMUNITY_SCORE_COMMENT_AUTO_HOLD_THRESHOLD = -5;

// ─── Base deltas ─────────────────────────────────────────────────────────────

export const COMMUNITY_SCORE_BASE_DELTAS = {
  POST_LIKE_RECEIVED: 1.0,
  COMMENT_LIKE_RECEIVED: 1.2,
  BEST_COMMENT_SELECTED: 5.0,
  COORDINATOR_RESTORES: 3.0,
  ADMIN_RESTORES: 5.0,
  POST_REPORT_SUBMITTED: -2.0,
  COMMENT_REPORT_SUBMITTED: -2.5,
  COORDINATOR_HOLDS: -5.0,
  ADMIN_DELETES: -10.0,
} as const;

// ─── Weight formula ───────────────────────────────────────────────────────────

const WARMTH_BASELINE = 36.5;
const WARMTH_WEIGHT_MIN = 0.5;
const WARMTH_WEIGHT_MAX = 2.0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getNeighbourWarmthWeight(neighbourWarmth: number): number {
  const raw = 1 + (neighbourWarmth - WARMTH_BASELINE) / 50;
  return clamp(raw, WARMTH_WEIGHT_MIN, WARMTH_WEIGHT_MAX);
}
