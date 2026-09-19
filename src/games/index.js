/**
 * Game packages live under src/games/<modeId>/.
 *
 * Each mode exposes:
 *   levels.js  – data-driven stage configs (+ builders/helpers)
 *   *Game.jsx  – UI, exported by name (no default export)
 *   index.js   – public exports (`export * from "./<Name>.jsx"`)
 *
 * To add a mode, add an entry to registry.js — App and SettingsMenu both read
 * from it. To add stages of an existing mode, append objects to that mode's
 * LEVELS array in levels.js; runtime reads them by index or score threshold via
 * levelUtils.js.
 */
export {
  clampLevelIndex,
  getLevelByIndex,
  getLevelByThreshold,
  levelNumber,
  levelCount,
} from "./levelUtils.js";

export {
  GAMES,
  PLAY,
  LEARNING,
  DEFAULT_GAME_ID,
  getGame,
  gamesByCategory,
} from "./registry.js";
