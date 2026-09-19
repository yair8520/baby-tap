/**
 * Game packages live under src/games/<modeId>/.
 *
 * Each mode should expose:
 *   levels.js  – data-driven stage configs (+ builders/helpers)
 *   *Game.jsx  – UI (optional for modes still rendered in App)
 *   index.js   – public exports
 *
 * To add more stages of a type: append objects to that mode's LEVELS array
 * in levels.js. Runtime reads by index / threshold helpers from levelUtils.js.
 */
export { clampLevelIndex, getLevelByIndex, getLevelByThreshold, levelNumber, levelCount } from "./levelUtils.js";
