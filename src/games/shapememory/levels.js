/**
 * Shape Memory (sequence recall) – level definitions.
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

export const SHAPEMEMORY_LEVELS = [
  {
    id: 1,
    seqLen: 2,
    showMs: 3000,
    shapes: 1,
    colors: 2,
    label: { he: "מתחיל", en: "Starter" },
  },
  {
    id: 2,
    seqLen: 2,
    showMs: 3000,
    shapes: 2,
    colors: 3,
    label: { he: "קל", en: "Easy" },
  },
  {
    id: 3,
    seqLen: 3,
    showMs: 2500,
    shapes: 3,
    colors: 3,
    label: { he: "בינוני", en: "Medium" },
  },
  {
    id: 4,
    seqLen: 3,
    showMs: 2500,
    shapes: 4,
    colors: 4,
    label: { he: "קשה", en: "Hard" },
  },
  {
    id: 5,
    seqLen: 4,
    showMs: 2000,
    shapes: 4,
    colors: 5,
    label: { he: "מאתגר", en: "Challenging" },
  },
  {
    id: 6,
    seqLen: 4,
    showMs: 2000,
    shapes: 4,
    colors: 6,
    label: { he: "אלוף", en: "Master" },
  },
];

export function getShapeMemoryLevel(levelIdx) {
  return SHAPEMEMORY_LEVELS[
    clampLevelIndex(levelIdx, SHAPEMEMORY_LEVELS.length)
  ];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSequence(cfg) {
  const shapes = ALL_SHAPES.slice(0, cfg.shapes);
  const colors = shuffle(PALETTE).slice(0, cfg.colors);
  const seq = [];
  for (let i = 0; i < cfg.seqLen; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    seq.push({ shape, colorId: color.id, fill: color.fill });
  }
  return seq;
}

export function buildPalette(sequence, cfg) {
  const inSeq = new Set(sequence.map((s) => `${s.shape}|${s.colorId}`));
  const shapes = ALL_SHAPES.slice(0, cfg.shapes);
  const colors = shuffle(PALETTE).slice(0, cfg.colors);

  const uniqueItems = [];
  const seen = new Set();
  for (const item of sequence) {
    const key = `${item.shape}|${item.colorId}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push({ ...item, id: key });
    }
  }

  const distractors = [];
  for (const shape of shapes) {
    for (const color of colors) {
      const key = `${shape}|${color.id}`;
      if (!inSeq.has(key)) {
        distractors.push({
          shape,
          colorId: color.id,
          fill: color.fill,
          id: key,
        });
      }
    }
  }

  const numDistractors = Math.min(
    shuffle(distractors).length,
    2 + Math.floor(Math.random() * 3),
  );
  const extras = shuffle(distractors).slice(0, numDistractors);
  return shuffle([...uniqueItems, ...extras]);
}
