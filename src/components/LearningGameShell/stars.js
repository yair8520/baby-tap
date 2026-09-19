/** Shared star scoring for learning games (0 mistakes → 3 stars). */
export function starsFromMistakes(mistakes) {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}
