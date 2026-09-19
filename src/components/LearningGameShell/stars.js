/** Shared star scoring for learning games (0 mistakes → 3 stars). */
export function starsFromMistakes(mistakes) {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}

const isStarCount = (value) =>
  Number.isInteger(value) && value >= 0 && value <= 3;

/**
 * Normalize persisted best scores. Legacy cumulative totals are deterministically
 * distributed from the first level onward and capped at three stars per level.
 */
export function normalizeBestStars(value, maxLevels = Infinity) {
  if (Number.isInteger(value) && value >= 0) {
    if (!Number.isInteger(maxLevels) || maxLevels < 0) return [];
    let remaining = Math.min(value, maxLevels * 3);
    const migrated = [];
    while (remaining > 0 && migrated.length < maxLevels) {
      const stars = Math.min(3, remaining);
      migrated.push(stars);
      remaining -= stars;
    }
    return migrated;
  }
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
