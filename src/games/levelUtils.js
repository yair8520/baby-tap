/**
 * Shared helpers for data-driven game levels.
 * Each game keeps its own levels.js schema; use these for common lookups.
 */

/** Clamp a 0-based index into [0, length-1]. */
export function clampLevelIndex(index, length) {
  const safeLength = Number.isFinite(length) ? Math.floor(length) : 0;
  if (safeLength <= 0) return 0;

  const numericIndex = Number(index);
  if (!Number.isFinite(numericIndex)) return 0;
  return Math.max(0, Math.min(Math.floor(numericIndex), safeLength - 1));
}

/** Get level config by 0-based index (clamped). */
export function getLevelByIndex(levels, index) {
  if (!levels?.length) return null;
  return levels[clampLevelIndex(index, levels.length)];
}

/**
 * Pick the highest level whose thresholdField <= value.
 * Levels must be sorted ascending by thresholdField.
 */
export function getLevelByThreshold(levels, value, thresholdField = "minScore") {
  if (!levels?.length) return null;
  let config = levels[0];
  for (const lvl of levels) {
    if (value >= lvl[thresholdField]) config = lvl;
    else break;
  }
  return config;
}

/** 1-based level number from 0-based index (clamped). */
export function levelNumber(index, length) {
  return clampLevelIndex(index, length) + 1;
}

/** How many levels are defined for a game. */
export function levelCount(levels) {
  return levels?.length ?? 0;
}
