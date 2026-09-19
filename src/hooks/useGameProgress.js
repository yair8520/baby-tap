import { useLocalStorage } from "./useLocalStorage.js";
import { MODE_LEVEL_KEYS, MODE_STARS_KEYS } from "../storage/keys.js";

/**
 * Persist a 0-based level index for a game mode.
 * @param {keyof typeof MODE_LEVEL_KEYS | string} modeId
 * @param {number} [defaultLevel=0]
 */
export function useGameLevel(modeId, defaultLevel = 0) {
  const key = MODE_LEVEL_KEYS[modeId] ?? `${modeId}Level`;
  return useLocalStorage(key, defaultLevel);
}

/**
 * Persist cumulative stars for drag/learning games.
 * @param {keyof typeof MODE_STARS_KEYS | string} modeId
 * @param {number} [defaultStars=0]
 */
export function useGameStars(modeId, defaultStars = 0) {
  const key = MODE_STARS_KEYS[modeId] ?? `${modeId}Stars`;
  return useLocalStorage(key, defaultStars);
}
