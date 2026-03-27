/**
 * Balloon pop mode – level progression.
 * Each level increases balloon speed and decreases spawn interval.
 */
export const BALLOON_LEVEL_STEP = 5; // pops needed to advance a level

export const BALLOON_LEVELS = [
  { id: 1, speedFactor: 1.0, spawnIntervalMs: 1200, maxOnScreen: 6 },
  { id: 2, speedFactor: 1.3, spawnIntervalMs: 1130, maxOnScreen: 7 },
  { id: 3, speedFactor: 1.6, spawnIntervalMs: 1060, maxOnScreen: 7 },
  { id: 4, speedFactor: 1.9, spawnIntervalMs: 990,  maxOnScreen: 8 },
  { id: 5, speedFactor: 2.2, spawnIntervalMs: 920,  maxOnScreen: 8 },
  { id: 6, speedFactor: 2.5, spawnIntervalMs: 850,  maxOnScreen: 9 },
  { id: 7, speedFactor: 2.8, spawnIntervalMs: 780,  maxOnScreen: 9 },
  { id: 8, speedFactor: 3.1, spawnIntervalMs: 710,  maxOnScreen: 10 },
  { id: 9, speedFactor: 3.4, spawnIntervalMs: 660,  maxOnScreen: 10 },
  { id: 10, speedFactor: 3.7, spawnIntervalMs: 600, maxOnScreen: 12 },
];

export function getBalloonLevelConfig(pops) {
  const levelIdx = Math.min(
    Math.floor(pops / BALLOON_LEVEL_STEP),
    BALLOON_LEVELS.length - 1
  );
  return BALLOON_LEVELS[levelIdx];
}

export function getBalloonLevelNumber(pops) {
  return Math.min(Math.floor(pops / BALLOON_LEVEL_STEP) + 1, BALLOON_LEVELS.length);
}
