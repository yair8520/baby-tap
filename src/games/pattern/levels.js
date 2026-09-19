/**
 * Pattern Game – level definitions.
 * patternTypes: which pattern templates are allowed at this stage.
 */
import { clampLevelIndex } from "../levelUtils.js";

export const PALETTE = [
  { id: "red", fill: "#FF3B3B" },
  { id: "blue", fill: "#2979FF" },
  { id: "yellow", fill: "#FFD600" },
  { id: "green", fill: "#00C853" },
  { id: "purple", fill: "#BB44FF" },
  { id: "orange", fill: "#FF7700" },
];

export const ALL_SHAPES = ["circle", "square", "triangle", "star"];

export const PATTERN_TYPES = {
  ABAB: { slots: [0, 1, 0, 1, 0], answer: 0 },
  ABCABC: { slots: [0, 1, 2, 0, 1, 2], answer: 2 },
  AABB: { slots: [0, 0, 1, 1, 0, 0], answer: 0 },
  ABBA: { slots: [0, 1, 1, 0, 0, 1], answer: 1 },
  AAAB: { slots: [0, 0, 0, 1, 0, 0], answer: 0 },
};

/** Explicit stages — add rows to grow the campaign. */
export const PATTERN_LEVELS = [
  { id: 1, patternTypes: ["ABAB"], label: { he: "ABAB", en: "ABAB" } },
  { id: 2, patternTypes: ["ABAB"], label: { he: "ABAB", en: "ABAB" } },
  { id: 3, patternTypes: ["ABAB"], label: { he: "ABAB", en: "ABAB" } },
  { id: 4, patternTypes: ["ABCABC"], label: { he: "ABC", en: "ABC" } },
  { id: 5, patternTypes: ["ABCABC"], label: { he: "ABC", en: "ABC" } },
  { id: 6, patternTypes: ["ABCABC"], label: { he: "ABC", en: "ABC" } },
  { id: 7, patternTypes: ["AABB"], label: { he: "AABB", en: "AABB" } },
  { id: 8, patternTypes: ["ABBA"], label: { he: "ABBA", en: "ABBA" } },
  { id: 9, patternTypes: ["AABB", "ABBA"], label: { he: "מעורב", en: "Mixed" } },
  {
    id: 10,
    patternTypes: Object.keys(PATTERN_TYPES),
    label: { he: "אקראי", en: "Random" },
  },
];

export function getPatternLevel(levelIdx) {
  return PATTERN_LEVELS[clampLevelIndex(levelIdx, PATTERN_LEVELS.length)];
}

export function getPatternType(levelIdx) {
  const cfg = getPatternLevel(levelIdx);
  const types = cfg.patternTypes;
  return types[Math.floor(Math.random() * types.length)];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickDistinct(n, excludeSet) {
  const all = [];
  for (const shape of ALL_SHAPES) {
    for (const color of PALETTE) {
      const key = `${shape}|${color.id}`;
      if (!excludeSet.has(key)) {
        all.push({ shape, colorId: color.id, fill: color.fill, id: key });
      }
    }
  }
  return shuffle(all).slice(0, n);
}

export function buildLevel(levelIdx) {
  const typeName = getPatternType(levelIdx);
  const type = PATTERN_TYPES[typeName];
  const maxSlot = Math.max(...type.slots);
  const numUnique = maxSlot + 1;

  const items = [];
  const usedKeys = new Set();
  for (let i = 0; i < numUnique; i++) {
    let candidate;
    let attempts = 0;
    do {
      const shape = ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)];
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const key = `${shape}|${color.id}`;
      candidate = { shape, colorId: color.id, fill: color.fill, id: key };
      attempts++;
    } while (usedKeys.has(candidate.id) && attempts < 100);
    usedKeys.add(candidate.id);
    items.push(candidate);
  }

  const fullPattern = type.slots.map((idx) => ({ ...items[idx] }));
  const displayPattern = fullPattern.slice(0, fullPattern.length - 1);
  const answer = { ...items[type.answer] };

  const distractors = pickDistinct(3, usedKeys).slice(0, 3);
  const choices = shuffle([
    { ...answer, id: `choice-correct-${answer.id}` },
    ...distractors.map((d, i) => ({ ...d, id: `choice-dist-${i}-${d.id}` })),
  ]).slice(0, 4);

  const hasCorrect = choices.some(
    (c) => c.shape === answer.shape && c.colorId === answer.colorId,
  );
  if (!hasCorrect) {
    choices[0] = { ...answer, id: `choice-correct-${answer.id}` };
  }

  return { fullPattern, displayPattern, answer, choices };
}
