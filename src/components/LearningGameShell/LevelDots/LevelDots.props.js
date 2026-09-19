/**
 * @typedef {Object} LevelDotsProps
 * @property {number} [total]        How many stages the campaign has.
 * @property {number} [currentIndex] 0-based index of the active stage.
 * @property {number} [maxUnlocked]  Highest selectable index; defaults to currentIndex.
 * @property {(index: number) => void} [onSelect] Omit to render a read-only strip.
 */

export const DEFAULT_LEVEL_DOTS_PROPS = {
  total: 0,
  currentIndex: 0,
};
