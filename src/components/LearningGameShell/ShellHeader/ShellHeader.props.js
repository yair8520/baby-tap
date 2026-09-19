/**
 * @typedef {Object} ShellHeaderProps
 * @property {number} [levelNum]  1-based stage number shown in the badge.
 * @property {number} [starCount] Stars earned so far in this stage.
 * @property {number} [maxStars]  Stars obtainable per stage.
 * @property {() => void} [onExit] Leave the game.
 */

export const DEFAULT_SHELL_HEADER_PROPS = {
  levelNum: 1,
  starCount: 3,
  maxStars: 3,
};
