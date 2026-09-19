/**
 * Balloon pop mode – level progression.
 * Add rows to BALLOON_LEVELS to extend the campaign.
 */
import { clampLevelIndex, getLevelByIndex } from "../levelUtils.js";

export const BALLOON_LEVEL_STEP = 5; // pops needed to advance a level

export const BALLOON_LEVELS = [
  { id: 1, speedFactor: 1.0, spawnIntervalMs: 1200, maxOnScreen: 7 },
  { id: 2, speedFactor: 1.3, spawnIntervalMs: 1130, maxOnScreen: 8 },
  { id: 3, speedFactor: 1.6, spawnIntervalMs: 1060, maxOnScreen: 9 },
  { id: 4, speedFactor: 1.9, spawnIntervalMs: 990, maxOnScreen: 10 },
  { id: 5, speedFactor: 2.2, spawnIntervalMs: 920, maxOnScreen: 11 },
  { id: 6, speedFactor: 2.5, spawnIntervalMs: 850, maxOnScreen: 12 },
  { id: 7, speedFactor: 2.8, spawnIntervalMs: 780, maxOnScreen: 13 },
  { id: 8, speedFactor: 3.1, spawnIntervalMs: 710, maxOnScreen: 14 },
  { id: 9, speedFactor: 3.4, spawnIntervalMs: 660, maxOnScreen: 15 },
  { id: 10, speedFactor: 3.7, spawnIntervalMs: 600, maxOnScreen: 16 },
  { id: 11, speedFactor: 4.0, spawnIntervalMs: 560, maxOnScreen: 17 },
  { id: 12, speedFactor: 4.3, spawnIntervalMs: 520, maxOnScreen: 18 },
  { id: 13, speedFactor: 4.6, spawnIntervalMs: 480, maxOnScreen: 18 },
  { id: 14, speedFactor: 4.9, spawnIntervalMs: 450, maxOnScreen: 19 },
  { id: 15, speedFactor: 5.2, spawnIntervalMs: 420, maxOnScreen: 20 },
];

/** 0-based index from pop count */
export function getBalloonLevelIndex(pops) {
  return clampLevelIndex(
    Math.floor(pops / BALLOON_LEVEL_STEP),
    BALLOON_LEVELS.length,
  );
}

export function getBalloonLevelConfig(pops) {
  return getLevelByIndex(BALLOON_LEVELS, getBalloonLevelIndex(pops));
}

/** 1-based level number shown in UI */
export function getBalloonLevelNumber(pops) {
  return getBalloonLevelIndex(pops) + 1;
}

/** Config by 1-based level number (for restored saved level) */
export function getBalloonConfigByLevel(levelNumber) {
  return getLevelByIndex(BALLOON_LEVELS, levelNumber - 1);
}
