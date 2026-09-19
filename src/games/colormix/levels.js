/**
 * Color Mix – level definitions.
 * Each level lists which primary combos the player must mix.
 */
import { clampLevelIndex } from "../levelUtils.js";

export const SOURCES = [
  { id: "red", fill: "#FF3B3B", glow: "rgba(255,59,59,0.6)" },
  { id: "blue", fill: "#2979FF", glow: "rgba(41,121,255,0.6)" },
  { id: "yellow", fill: "#FFD600", glow: "rgba(255,214,0,0.6)" },
];

export const MIX_TABLE = {
  "blue+red": {
    resultFill: "#9B34FF",
    resultName: { he: "סגול", en: "Purple" },
    glow: "rgba(155,52,255,0.6)",
  },
  "red+yellow": {
    resultFill: "#FF8800",
    resultName: { he: "כתום", en: "Orange" },
    glow: "rgba(255,136,0,0.6)",
  },
  "blue+yellow": {
    resultFill: "#00BB44",
    resultName: { he: "ירוק", en: "Green" },
    glow: "rgba(0,187,68,0.6)",
  },
};

export function mixKey(a, b) {
  return [a, b].sort().join("+");
}

export const ALL_COMBOS = [
  { color1: "red", color2: "blue", key: mixKey("red", "blue") },
  { color1: "red", color2: "yellow", key: mixKey("red", "yellow") },
  { color1: "blue", color2: "yellow", key: mixKey("blue", "yellow") },
];

export const BOWL_R = 72;
export const SOURCE_R = 40;
export const MINI_R = 28;

/**
 * comboIds: indices into ALL_COMBOS
 * bowls: number of mixing bowls
 */
export const COLORMIX_LEVELS = [
  { id: 1, comboIds: [0], bowls: 1, label: { he: "סגול", en: "Purple" } },
  { id: 2, comboIds: [1], bowls: 1, label: { he: "כתום", en: "Orange" } },
  { id: 3, comboIds: [2], bowls: 1, label: { he: "ירוק", en: "Green" } },
  { id: 4, comboIds: [0, 1], bowls: 1, label: { he: "שניים", en: "Two" } },
  { id: 5, comboIds: [1, 2], bowls: 1, label: { he: "שניים", en: "Two" } },
  { id: 6, comboIds: [0, 2], bowls: 1, label: { he: "שניים", en: "Two" } },
  { id: 7, comboIds: [0, 1], bowls: 1, label: { he: "חזרה", en: "Repeat" } },
  { id: 8, comboIds: [0, 1, 2], bowls: 2, label: { he: "שלושה", en: "Three" } },
  { id: 9, comboIds: [0, 1, 2], bowls: 2, label: { he: "מאתגר", en: "Hard" } },
  { id: 10, comboIds: [0, 1, 2], bowls: 2, label: { he: "אלוף", en: "Master" } },
];

export function getColorMixLevel(levelIdx) {
  return COLORMIX_LEVELS[clampLevelIndex(levelIdx, COLORMIX_LEVELS.length)];
}

export function buildLevel(levelIdx, W, H) {
  const cfg = getColorMixLevel(levelIdx);
  const combos = cfg.comboIds.map((i) => ALL_COMBOS[i]);
  const numTargets = combos.length;
  const numBowls = cfg.bowls;

  const targetY = H * 0.24;
  const targets = combos.map((combo, i) => {
    const mix = MIX_TABLE[combo.key];
    const xFrac =
      numTargets === 1
        ? 0.5
        : numTargets === 2
          ? i === 0
            ? 0.3
            : 0.7
          : [0.2, 0.5, 0.8][i];
    return {
      id: `tgt-${i}`,
      color1: combo.color1,
      color2: combo.color2,
      resultFill: mix.resultFill,
      resultName: mix.resultName,
      glow: mix.glow,
      cx: W * xFrac,
      cy: targetY,
      matched: false,
    };
  });

  const bowlY = H * 0.58;
  const bowls = Array.from({ length: numBowls }, (_, i) => {
    const xFrac = numBowls === 1 ? 0.5 : i === 0 ? 0.3 : 0.7;
    return {
      id: `bowl-${i}`,
      cx: W * xFrac,
      cy: bowlY,
      slot1: null,
      slot2: null,
    };
  });

  const sourceY = H * 0.875;
  const sources = SOURCES.map((src, i) => ({
    ...src,
    homeCx: W * [0.25, 0.5, 0.75][i],
    homeCy: sourceY,
  }));

  return { targets, bowls, sources };
}
