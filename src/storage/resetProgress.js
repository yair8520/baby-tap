import { STORAGE_KEYS, MODE_LEVEL_KEYS, MODE_STARS_KEYS } from "./keys.js";

const PREFIX = "bt_";

/** All progress-related logical keys (not settings). */
export function listProgressKeys() {
  return [
    ...new Set([
      STORAGE_KEYS.balloonLevel,
      STORAGE_KEYS.targetHighScore,
      STORAGE_KEYS.shapesScore,
      ...Object.values(MODE_LEVEL_KEYS),
      ...Object.values(MODE_STARS_KEYS),
    ]),
  ];
}

/** Remove all progress keys from localStorage. Settings are kept. */
export function resetAllProgress() {
  for (const key of listProgressKeys()) {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
    } catch {
      // ignore
    }
  }
}
