import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage.js";
import { MODE_LEVEL_KEYS, MODE_STARS_KEYS } from "../storage/keys.js";

/**
 * Persist a 0-based level index for a game mode.
 * Optionally clamp to maxLevels-1 when the campaign shrinks.
 * @param {keyof typeof MODE_LEVEL_KEYS | string} modeId
 * @param {number} [defaultLevel=0]
 * @param {{ maxLevels?: number }} [opts]
 */
export function useGameLevel(modeId, defaultLevel = 0, opts = {}) {
  const key = MODE_LEVEL_KEYS[modeId] ?? `${modeId}Level`;
  const [levelIdx, setLevelIdx] = useLocalStorage(key, defaultLevel);
  const maxLevels = opts.maxLevels;

  useEffect(() => {
    if (
      typeof maxLevels === "number" &&
      maxLevels > 0 &&
      levelIdx >= maxLevels
    ) {
      setLevelIdx(maxLevels - 1);
    }
  }, [maxLevels, levelIdx, setLevelIdx]);

  return [levelIdx, setLevelIdx];
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
