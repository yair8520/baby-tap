/**
 * Shape Match – level definitions.
 * Add rows here to create more stages; buildLevel reads by index.
 */
import { clampLevelIndex } from "../levelUtils.js";

export const PALETTE = [
  { id: "red", fill: "#FF3B3B", glow: "rgba(255,59,59,0.55)" },
  { id: "blue", fill: "#2979FF", glow: "rgba(41,121,255,0.55)" },
  { id: "yellow", fill: "#FFD600", glow: "rgba(255,214,0,0.55)" },
  { id: "green", fill: "#00C853", glow: "rgba(0,200,83,0.55)" },
  { id: "purple", fill: "#BB44FF", glow: "rgba(187,68,255,0.55)" },
  { id: "orange", fill: "#FF7700", glow: "rgba(255,119,0,0.55)" },
];

export const SHAPES = ["circle", "square", "triangle", "star", "hexagon"];

export const PIECE_R = 55;
export const SLOT_R = 72;
export const SNAP = 80;

export const SLOT_GRIDS = {
  2: [
    [0.25, 0.38],
    [0.75, 0.38],
  ],
  3: [
    [0.2, 0.3],
    [0.8, 0.3],
    [0.5, 0.54],
  ],
  4: [
    [0.22, 0.24],
    [0.78, 0.24],
    [0.22, 0.54],
    [0.78, 0.54],
  ],
  5: [
    [0.15, 0.2],
    [0.5, 0.17],
    [0.85, 0.2],
    [0.28, 0.5],
    [0.72, 0.5],
  ],
};

export const PIECE_ROWS = {
  2: [
    [0.27, 0.83],
    [0.73, 0.83],
  ],
  3: [
    [0.2, 0.83],
    [0.5, 0.83],
    [0.8, 0.83],
  ],
  4: [
    [0.15, 0.83],
    [0.38, 0.83],
    [0.62, 0.83],
    [0.85, 0.83],
  ],
  5: [
    [0.12, 0.83],
    [0.31, 0.83],
    [0.5, 0.83],
    [0.69, 0.83],
    [0.88, 0.83],
  ],
};

/** count = pairs on screen; variety = how many shape types allowed */
export const SHAPEMATCH_LEVELS = [
  { id: 1, count: 2, variety: 1, label: { he: "מתחיל", en: "Starter" } },
  { id: 2, count: 3, variety: 1, label: { he: "קל", en: "Easy" } },
  { id: 3, count: 4, variety: 1, label: { he: "בינוני", en: "Medium" } },
  { id: 4, count: 2, variety: 2, label: { he: "צורות", en: "Shapes" } },
  { id: 5, count: 3, variety: 2, label: { he: "מעורב", en: "Mixed" } },
  { id: 6, count: 4, variety: 2, label: { he: "קשה", en: "Hard" } },
  { id: 7, count: 3, variety: 3, label: { he: "משולשים", en: "Triangles" } },
  { id: 8, count: 4, variety: 3, label: { he: "מאתגר", en: "Challenging" } },
  { id: 9, count: 4, variety: 4, label: { he: "כוכבים", en: "Stars" } },
  { id: 10, count: 5, variety: 5, label: { he: "אלוף", en: "Master" } },
];

export function getShapeMatchLevel(levelIdx) {
  return SHAPEMATCH_LEVELS[
    clampLevelIndex(levelIdx, SHAPEMATCH_LEVELS.length)
  ];
}

export function buildLevel(levelIdx, W, H) {
  const cfg = getShapeMatchLevel(levelIdx);
  const { count, variety } = cfg;
  const availShapes = SHAPES.slice(0, variety);
  const colors = [...PALETTE].sort(() => Math.random() - 0.5).slice(0, count);

  const items = colors.map((c, i) => ({
    shape: availShapes[i % availShapes.length],
    colorId: c.id,
    fill: c.fill,
    glow: c.glow,
  }));

  const slotGrid = SLOT_GRIDS[count] || SLOT_GRIDS[5];
  const pieceGrid = PIECE_ROWS[count] || PIECE_ROWS[5];
  const slotIdxPerm = [...Array(count).keys()].sort(() => Math.random() - 0.5);

  const slots = items.map((item, i) => ({
    id: `sl-${i}`,
    ...item,
    cx: slotGrid[slotIdxPerm[i]][0] * W,
    cy: slotGrid[slotIdxPerm[i]][1] * H,
    filled: false,
  }));

  const pieceOrder = [...items].sort(() => Math.random() - 0.5);
  const pieces = pieceOrder.map((item, i) => ({
    id: `pc-${i}`,
    ...item,
    homeCx: pieceGrid[i][0] * W,
    homeCy: pieceGrid[i][1] * H,
    cx: pieceGrid[i][0] * W,
    cy: pieceGrid[i][1] * H,
    matched: false,
  }));

  return { slots, pieces };
}
