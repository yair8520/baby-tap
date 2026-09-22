/**
 * @typedef {Object} LearningGameShellProps
 * @property {number} [levelNum]     1-based stage number.
 * @property {boolean} [showLevel]   When false, hides the stage badge.
 * @property {number} [totalLevels]  Campaign length; the stage strip is hidden below 2.
 * @property {number} [maxUnlocked]  Highest 0-based stage the player may jump to.
 * @property {(index: number) => void} [onSelectLevel] Omit for a read-only strip.
 * @property {() => void} [onExit]
 * @property {boolean} [levelDone]   Shows the completion overlay.
 * @property {number} [starCount]    Stars earned in the current stage.
 * @property {number} [maxStars]     Stars obtainable per stage; 0 hides the star row.
 * @property {import('react').ReactNode} [headerTrailing] Replaces the star row when maxStars is 0.
 * @property {() => void} [onNextLevel]
 * @property {() => void} [onReplay]
 * @property {boolean} [isLastLevel] Replays the last stage after the celebration.
 * @property {import('react').ReactNode} [children] The playfield.
 */

export const DEFAULT_LEARNING_GAME_SHELL_PROPS = {
  levelNum: 1,
  showLevel: true,
  levelDone: false,
  starCount: 3,
  maxStars: 3,
  isLastLevel: false,
};
