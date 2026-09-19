/**
 * Game packages live under src/games/<modeId>/.
 *
 * Each mode should expose:
 *   levels.js  – data-driven stage configs (+ builders/helpers)
 *   *Game.jsx  – UI
 *   index.js   – public exports
 *
 * To add more stages of a type: append objects to that mode's LEVELS array
 * in levels.js. Runtime reads by index / threshold helpers from levelUtils.js.
 */
export { clampLevelIndex, getLevelByIndex, getLevelByThreshold, levelNumber, levelCount } from "./levelUtils.js";

export { default as ClassicGame } from "./classic";
export { default as DrumsGame } from "./drums";
export { default as BalloonsGame } from "./balloons";
export { default as TargetsGame } from "./targets";
export { default as PianoGame } from "./piano";
export { default as SleepGame } from "./sleep";
