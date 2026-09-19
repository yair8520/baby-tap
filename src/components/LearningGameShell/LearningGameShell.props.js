/**
 * @typedef {Object} LearningGameShellProps
 * @property {number} [levelNum]     1-based stage number.
 * @property {number} [totalLevels]  Campaign length; the stage strip is hidden below 2.
 * @property {number} [maxUnlocked]  Highest 0-based stage the player may jump to.
 * @property {(index: number) => void} [onSelectLevel] Omit for a read-only strip.
 * @property {number} [totalStars]   Career total shown on the completion card.
 * @property {() => void} [onExit]
 * @property {boolean} [levelDone]   Shows the completion overlay.
 * @property {number} [starCount]    Stars earned in the current stage.
 * @property {number} [maxStars]     Stars obtainable per stage.
 * @property {() => void} [onNextLevel]
 * @property {() => void} [onReplay]
 * @property {import('react').ReactNode} [children] The playfield.
 */

export const DEFAULT_LEARNING_GAME_SHELL_PROPS = {
  levelNum: 1,
  levelDone: false,
  starCount: 3,
  maxStars: 3,
};
