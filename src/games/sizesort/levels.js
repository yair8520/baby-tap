/**
 * Size Sort – level definitions.
 * count = how many circles to sort by size.
 */
import { clampLevelIndex } from "../levelUtils.js";

export const PALETTE = [
  { id: "coral", fill: "#FF6B6B", glow: "rgba(255,107,107,0.6)" },
  { id: "sky", fill: "#38BDF8", glow: "rgba(56,189,248,0.6)" },
  { id: "lime", fill: "#84CC16", glow: "rgba(132,204,22,0.6)" },
  { id: "amber", fill: "#FBBF24", glow: "rgba(251,191,36,0.6)" },
  { id: "violet", fill: "#A78BFA", glow: "rgba(167,139,250,0.6)" },
  { id: "rose", fill: "#FB7185", glow: "rgba(251,113,133,0.6)" },
  { id: "cyan", fill: "#22D3EE", glow: "rgba(34,211,238,0.6)" },
  { id: "emerald", fill: "#34D399", glow: "rgba(52,211,153,0.6)" },
  { id: "orange", fill: "#FF9500", glow: "rgba(255,149,0,0.6)" },
  { id: "pink", fill: "#EC4899", glow: "rgba(236,72,153,0.6)" },
];

export const SIZES = {
  3: [50, 80, 110],
  4: [45, 68, 90, 112],
  5: [40, 60, 80, 100, 120],
};

export const SLOT_PAD = 20;

export const SIZESORT_LEVELS = [
  { id: 1, count: 3, label: { he: "מתחיל", en: "Starter" } },
  { id: 2, count: 3, label: { he: "קל", en: "Easy" } },
  { id: 3, count: 3, label: { he: "בינוני", en: "Medium" } },
  { id: 4, count: 4, label: { he: "ארבעה", en: "Four" } },
  { id: 5, count: 4, label: { he: "קשה", en: "Hard" } },
  { id: 6, count: 4, label: { he: "מאתגר", en: "Challenging" } },
  { id: 7, count: 5, label: { he: "חמישה", en: "Five" } },
  { id: 8, count: 5, label: { he: "מומחה", en: "Expert" } },
  { id: 9, count: 5, label: { he: "קשה מאוד", en: "Very Hard" } },
  { id: 10, count: 5, label: { he: "אלוף", en: "Master" } },
];

export function getSizeSortLevel(levelIdx) {
  return SIZESORT_LEVELS[clampLevelIndex(levelIdx, SIZESORT_LEVELS.length)];
}

export function buildLevel(levelIdx, W, H) {
  const cfg = getSizeSortLevel(levelIdx);
  const count = cfg.count;
  const sizes = SIZES[count];
  const color = PALETTE[levelIdx % PALETTE.length];

  const slotAreaTop = 80;
  const slotAreaBottom = H * 0.55;
  const slotAreaCy = (slotAreaTop + slotAreaBottom) / 2;

  const maxSlotD = sizes[sizes.length - 1] + SLOT_PAD * 2;
  const gap = 14;
  const totalW = count * maxSlotD + (count - 1) * gap;
  const startX = (W - totalW) / 2 + maxSlotD / 2;

  const slots = sizes.map((sz, i) => ({
    id: `sl-${i}`,
    rank: i,
    cx: startX + i * (maxSlotD + gap),
    cy: slotAreaCy,
    expectedSize: sz,
    slotD: sz + SLOT_PAD * 2,
    filled: false,
    color: color.fill,
    glow: color.glow,
  }));

  const pieceAreaY = H * 0.78;
  const pieceTotalW = sizes.reduce((a, s) => a + s, 0) + (count - 1) * 24;
  const pieceStartX = (W - pieceTotalW) / 2;

  const pieceXPositions = [];
  let xCursor = pieceStartX;
  for (let i = 0; i < count; i++) {
    pieceXPositions.push(xCursor + sizes[i] / 2);
    xCursor += sizes[i] + 24;
  }

  const shuffledRanks = [...Array(count).keys()].sort(() => Math.random() - 0.5);

  const pieces = shuffledRanks.map((rank, posIdx) => ({
    id: `pc-${rank}`,
    rank,
    size: sizes[rank],
    fill: color.fill,
    glow: color.glow,
    homeCx: pieceXPositions[posIdx],
    homeCy: pieceAreaY,
    cx: pieceXPositions[posIdx],
    cy: pieceAreaY,
    matched: false,
  }));

  return { slots, pieces };
}
