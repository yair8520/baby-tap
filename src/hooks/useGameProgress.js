import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage.js";
import { MODE_LEVEL_KEYS, MODE_STARS_KEYS } from "../storage/keys.js";
import { clampLevelIndex } from "../games/levelUtils.js";
import { isNonNegativeInteger } from "../storage/validation.js";
import {
  normalizeBestStars,
  recordBestStars,
  totalBestStars,
} from "../components/LearningGameShell/stars.js";

/**
 * Persist a 0-based level index for a game mode.
 * Optionally clamp to maxLevels-1 when the campaign shrinks.
 * @param {keyof typeof MODE_LEVEL_KEYS | string} modeId
 * @param {number} [defaultLevel=0]
 * @param {{ maxLevels?: number }} [opts]
 */
export function useGameLevel(modeId, defaultLevel = 0, opts = {}) {
  const key = MODE_LEVEL_KEYS[modeId] ?? `${modeId}Level`;
  const [storedLevelIdx, setStoredLevelIdx] = useLocalStorage(
    key,
    defaultLevel,
    isNonNegativeInteger,
  );
  const maxLevels = opts.maxLevels;
  const hasLevelLimit =
    Number.isFinite(maxLevels) && Math.floor(maxLevels) > 0;
  const levelIdx = hasLevelLimit
    ? clampLevelIndex(storedLevelIdx, maxLevels)
    : storedLevelIdx;

  const setLevelIdx = useCallback(
    (nextLevel) => {
      setStoredLevelIdx((previousLevel) => {
        const candidate =
          typeof nextLevel === "function"
            ? nextLevel(previousLevel)
            : nextLevel;
        if (!isNonNegativeInteger(candidate)) return previousLevel;
        return hasLevelLimit
          ? clampLevelIndex(candidate, maxLevels)
          : candidate;
      });
    },
    [hasLevelLimit, maxLevels, setStoredLevelIdx],
  );

  useEffect(() => {
    if (storedLevelIdx !== levelIdx) setStoredLevelIdx(levelIdx);
  }, [levelIdx, setStoredLevelIdx, storedLevelIdx]);

  return [levelIdx, setLevelIdx];
}

/**
 * Persist cumulative stars for drag/learning games.
 * @param {keyof typeof MODE_STARS_KEYS | string} modeId
 * @param {number} [defaultStars=0]
 */
export function useGameStars(modeId, defaultStars = 0) {
  const key = MODE_STARS_KEYS[modeId] ?? `${modeId}Stars`;
  return useLocalStorage(key, defaultStars, isNonNegativeInteger);
}

const isBestStarsStorageValue = (value) =>
  Array.isArray(value) || isNonNegativeInteger(value);

/**
 * Persist the best star score for each level. Numeric cumulative values from
 * older releases are accepted long enough to migrate safely to an empty list.
 */
export function useGameBestStars(modeId, maxLevels) {
  const key = MODE_STARS_KEYS[modeId] ?? `${modeId}Stars`;
  const [storedStars, setStoredStars] = useLocalStorage(
    key,
    [],
    isBestStarsStorageValue,
  );
  const bestStars = useMemo(
    () => normalizeBestStars(storedStars, maxLevels),
    [maxLevels, storedStars],
  );

  useEffect(() => {
    if (JSON.stringify(storedStars) !== JSON.stringify(bestStars)) {
      setStoredStars(bestStars);
    }
  }, [bestStars, setStoredStars, storedStars]);

  const recordStars = useCallback(
    (levelIndex, stars) => {
      setStoredStars((previous) =>
        recordBestStars(previous, levelIndex, stars, maxLevels),
      );
    },
    [maxLevels, setStoredStars],
  );

  return {
    bestStars,
    recordStars,
    totalStars: totalBestStars(bestStars, maxLevels),
  };
}
