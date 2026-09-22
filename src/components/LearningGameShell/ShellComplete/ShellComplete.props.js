/**
 * @typedef {Object} ShellCompleteProps
 * @property {number} [starCount]  Stars earned in the stage just finished.
 * @property {number} [maxStars]   Stars obtainable per stage.
 * @property {boolean} [isLastLevel] Replay this stage after the last level.
 * @property {() => void} [onNextLevel] Advance after the celebration.
 * @property {() => void} [onReplay] Replay automatically after the last stage.
 */

export const DEFAULT_SHELL_COMPLETE_PROPS = {
  starCount: 3,
  maxStars: 3,
  isLastLevel: false,
};
