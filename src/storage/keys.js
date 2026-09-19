/**
 * Central localStorage key names (logical keys; useLocalStorage adds `bt_` prefix).
 * Keep all persistence keys here to avoid collisions and document shape.
 */
export const STORAGE_KEYS = {
  // Shell / settings
  lang: "lang",
  theme: "theme",
  vibrateOn: "vibrateOn",
  muteOn: "muteOn",
  gameMode: "gameMode",
  settingsTab: "settingsTab",

  // Play-mode progress
  balloonLevel: "balloonLevel", // 1-based level number (legacy)
  targetHighScore: "targetHighScore",

  // Learning / tap modes — 0-based level index
  memoryLevel: "memoryLevel",
  shapesLevel: "shapesLevel",
  shapesScore: "shapesScore",
  shapematchLevel: "shapematchLevel",
  shapematchStars: "shapematchStars",
  colormixLevel: "colormixLevel",
  colormixStars: "colormixStars",
  sizesortLevel: "sizesortLevel",
  sizesortStars: "sizesortStars",
  shapememoryLevel: "shapememoryLevel",
  shapememoryStars: "shapememoryStars",
  patternLevel: "patternLevel",
  patternStars: "patternStars",

  // Sleep / autoshow
  sleepSoundMode: "sleepSoundMode",
  sleepVolume: "sleepVolume",
  sleepEnabled: "sleepEnabled",
};

/** Mode id → level storage key (0-based index, except balloons which is 1-based). */
export const MODE_LEVEL_KEYS = {
  memory: STORAGE_KEYS.memoryLevel,
  shapes: STORAGE_KEYS.shapesLevel,
  shapematch: STORAGE_KEYS.shapematchLevel,
  colormix: STORAGE_KEYS.colormixLevel,
  sizesort: STORAGE_KEYS.sizesortLevel,
  shapememory: STORAGE_KEYS.shapememoryLevel,
  pattern: STORAGE_KEYS.patternLevel,
  balloons: STORAGE_KEYS.balloonLevel,
};

export const MODE_STARS_KEYS = {
  shapematch: STORAGE_KEYS.shapematchStars,
  colormix: STORAGE_KEYS.colormixStars,
  sizesort: STORAGE_KEYS.sizesortStars,
  shapememory: STORAGE_KEYS.shapememoryStars,
  pattern: STORAGE_KEYS.patternStars,
};

/** Keys that contain gameplay achievements rather than user preferences. */
export const PROGRESS_KEYS = [
  STORAGE_KEYS.balloonLevel,
  STORAGE_KEYS.targetHighScore,
  STORAGE_KEYS.memoryLevel,
  STORAGE_KEYS.shapesLevel,
  STORAGE_KEYS.shapesScore,
  STORAGE_KEYS.shapematchLevel,
  STORAGE_KEYS.shapematchStars,
  STORAGE_KEYS.colormixLevel,
  STORAGE_KEYS.colormixStars,
  STORAGE_KEYS.sizesortLevel,
  STORAGE_KEYS.sizesortStars,
  STORAGE_KEYS.shapememoryLevel,
  STORAGE_KEYS.shapememoryStars,
  STORAGE_KEYS.patternLevel,
  STORAGE_KEYS.patternStars,
];
