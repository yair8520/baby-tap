/** Shared star scoring for learning games (0 mistakes → 3 stars). */
export function starsFromMistakes(mistakes) {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}

const isStarCount = (value) =>
  Number.isInteger(value) && value >= 0 && value <= 3;

/**
 * Normalize persisted best scores. Legacy cumulative numbers intentionally
 * become an empty record because they cannot be assigned to individual levels.
 */
export function normalizeBestStars(value, maxLevels = Infinity) {
  if (!Array.isArray(value)) return [];

  const limit =
    Number.isInteger(maxLevels) && maxLevels >= 0
      ? maxLevels
      : value.length;

  return value
    .slice(0, limit)
    .map((stars) => (isStarCount(stars) ? stars : 0));
}

/** Return a new record containing the best score earned for one level. */
export function recordBestStars(value, levelIndex, stars, maxLevels = Infinity) {
  const normalized = normalizeBestStars(value, maxLevels);
  if (
    !Number.isInteger(levelIndex) ||
    levelIndex < 0 ||
    levelIndex >= maxLevels ||
    !isStarCount(stars)
  ) {
    return normalized;
  }

  const next = [...normalized];
  while (next.length <= levelIndex) next.push(0);
  next[levelIndex] = Math.max(next[levelIndex], stars);
  return next;
}

/** Sum normalized per-level best scores. */
export function totalBestStars(value, maxLevels = Infinity) {
  return normalizeBestStars(value, maxLevels).reduce(
    (total, stars) => total + stars,
    0,
  );
}
