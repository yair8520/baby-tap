/**
 * @typedef {Object} ShellCompleteProps
 * @property {number} [starCount]  Stars earned in the stage just finished.
 * @property {number} [maxStars]   Stars obtainable per stage.
 * @property {number} [totalStars] Career total; hidden when omitted.
 * @property {() => void} [onNextLevel] Hidden when omitted (last stage).
 * @property {() => void} [onReplay]    Hidden when omitted.
 */

export const DEFAULT_SHELL_COMPLETE_PROPS = {
  starCount: 3,
  maxStars: 3,
};
