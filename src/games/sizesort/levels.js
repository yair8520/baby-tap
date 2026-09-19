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

/** Design-time diameters (px) before viewport scaling. */
export const SIZES = {
  3: [50, 80, 110],
  4: [45, 68, 90, 112],
  5: [40, 60, 80, 100, 120],
};

export const SLOT_PAD = 20;
export const SLOT_GAP = 14;
export const PIECE_GAP = 24;

/** Match / slot pop animation peak scale (see SizeSort.css). */
export const MATCH_POP_SCALE = 1.35;
/** Drag lift scale (see SizeSort.css). */
export const DRAG_SCALE = 1.16;
/** Wrong-drop shake travel (see SizeSort.css). */
export const SHAKE_PX = 14;

/** Keep content clear of LearningGameShell header + direction label. */
export const TOP_CHROME = 88;
export const EDGE_MARGIN = 10;
export const MIN_ROW_GAP = 16;

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
  { id: 11, count: 5, label: { he: "ספיד", en: "Speed" } },
  { id: 12, count: 5, label: { he: "פרו", en: "Pro" } },
  { id: 13, count: 5, label: { he: "ערבוב", en: "Remix" } },
  { id: 14, count: 5, label: { he: "עלית", en: "Elite" } },
  { id: 15, count: 5, label: { he: "אגדה", en: "Legend" } },
];

export function getSizeSortLevel(levelIdx) {
  return SIZESORT_LEVELS[clampLevelIndex(levelIdx, SIZESORT_LEVELS.length)];
}

function dimsAtScale(baseSizes, scale) {
  const count = baseSizes.length;
  const sizes = baseSizes.map((s) => Math.max(14, Math.round(s * scale)));
  const slotPad = Math.max(5, Math.round(SLOT_PAD * scale));
  const gap = Math.max(6, Math.round(SLOT_GAP * scale));
  const pieceGap = Math.max(8, Math.round(PIECE_GAP * scale));
  const maxSize = sizes[sizes.length - 1];
  const maxSlotD = maxSize + slotPad * 2;
  const slotSpan =
    (count - 1) * (maxSlotD + gap) + maxSlotD * MATCH_POP_SCALE;
  const piecePacked =
    sizes.reduce((a, s) => a + s, 0) + (count - 1) * pieceGap;
  const pieceSpan =
    piecePacked - maxSize + maxSize * DRAG_SCALE + SHAKE_PX * 2;
  const neededH =
    maxSlotD * MATCH_POP_SCALE +
    maxSize * Math.max(MATCH_POP_SCALE, DRAG_SCALE) +
    MIN_ROW_GAP;
  return { sizes, slotPad, gap, pieceGap, maxSize, maxSlotD, slotSpan, pieceSpan, neededH };
}

/**
 * Uniform scale so slots + pieces (incl. match-pop / drag scale) fit in W×H.
 * Iterates after rounding so integer px sizes cannot reintroduce overflow.
 */
export function computeLayoutScale(count, W, H) {
  const baseSizes = SIZES[count];
  if (!baseSizes || !W || !H) return 1;

  const availW = Math.max(1, W - EDGE_MARGIN * 2);
  const availH = Math.max(1, H - TOP_CHROME - EDGE_MARGIN);

  let scale = 1;
  for (let i = 0; i < 12; i++) {
    const d = dimsAtScale(baseSizes, scale);
    const overW = Math.max(d.slotSpan, d.pieceSpan) / availW;
    const overH = d.neededH / availH;
    const over = Math.max(overW, overH, 1);
    if (over <= 1.001) break;
    scale = Math.min(scale, scale / over) * 0.995;
    if (scale <= 0.15) {
      scale = 0.15;
      break;
    }
  }
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

/** Clamp a piece center so its scaled circle stays inside the play area. */
export function clampPieceCenter(cx, cy, size, W, H, {
  visualScale = DRAG_SCALE,
  margin = EDGE_MARGIN,
  topInset = TOP_CHROME,
  shakePad = 0,
} = {}) {
  const r = (size / 2) * visualScale;
  const minX = margin + r + shakePad;
  const maxX = W - margin - r - shakePad;
  const minY = topInset + r;
  const maxY = H - margin - r;
  return {
    cx: Math.min(Math.max(cx, minX), Math.max(minX, maxX)),
    cy: Math.min(Math.max(cy, minY), Math.max(minY, maxY)),
  };
}

export function buildLevel(levelIdx, W, H) {
  const cfg = getSizeSortLevel(levelIdx);
  const count = cfg.count;
  const baseSizes = SIZES[count];
  const color = PALETTE[levelIdx % PALETTE.length];
  const scale = computeLayoutScale(count, W, H);
  const {
    sizes,
    slotPad,
    gap,
    pieceGap,
    maxSize,
    maxSlotD,
  } = dimsAtScale(baseSizes, scale);

  const slotPopR = (maxSlotD / 2) * MATCH_POP_SCALE;
  const pieceVisualR =
    (maxSize / 2) * Math.max(MATCH_POP_SCALE, DRAG_SCALE);

  const playTop = TOP_CHROME;
  const playBottom = H - EDGE_MARGIN;
  const playH = Math.max(1, playBottom - playTop);

  // Prefer classic proportions; fall back to packed rows on short viewports.
  let slotCy = playTop + playH * 0.28;
  let pieceCy = playTop + playH * 0.78;
  slotCy = Math.max(slotCy, playTop + slotPopR);
  pieceCy = Math.min(pieceCy, playBottom - pieceVisualR);

  const minSep = slotPopR + pieceVisualR + MIN_ROW_GAP;
  if (pieceCy - slotCy < minSep) {
    const mid = (playTop + playBottom) / 2;
    slotCy = mid - minSep / 2;
    pieceCy = mid + minSep / 2;
    if (slotCy - slotPopR < playTop) {
      slotCy = playTop + slotPopR;
      pieceCy = slotCy + minSep;
    }
    if (pieceCy + pieceVisualR > playBottom) {
      pieceCy = playBottom - pieceVisualR;
      slotCy = Math.max(playTop + slotPopR, pieceCy - minSep);
    }
  }

  const slotCentersSpan = (count - 1) * (maxSlotD + gap);
  const slotBlockW = slotCentersSpan + maxSlotD * MATCH_POP_SCALE;
  let slotStartCx =
    EDGE_MARGIN +
    slotPopR +
    Math.max(0, (W - EDGE_MARGIN * 2 - slotBlockW) / 2);

  // Final safety: keep outermost pop extents on-screen after rounding.
  const slotEndCx = slotStartCx + slotCentersSpan;
  if (slotEndCx + slotPopR > W - EDGE_MARGIN) {
    slotStartCx = W - EDGE_MARGIN - slotPopR - slotCentersSpan;
  }
  if (slotStartCx - slotPopR < EDGE_MARGIN) {
    slotStartCx = EDGE_MARGIN + slotPopR;
  }

  const slots = sizes.map((sz, i) => ({
    id: `sl-${i}`,
    rank: i,
    cx: slotStartCx + i * (maxSlotD + gap),
    cy: slotCy,
    expectedSize: sz,
    slotD: sz + slotPad * 2,
    filled: false,
    color: color.fill,
    glow: color.glow,
  }));

  const shuffledRanks = [...Array(count).keys()].sort(
    () => Math.random() - 0.5,
  );
  const placedSizes = shuffledRanks.map((rank) => sizes[rank]);

  const pieceTotalW =
    placedSizes.reduce((a, s) => a + s, 0) + (count - 1) * pieceGap;
  let pieceStartX = (W - pieceTotalW) / 2;

  // Keep homes inside drag+shake bounds even if the largest piece lands at an edge.
  const edgePad = (maxSize / 2) * DRAG_SCALE + SHAKE_PX;
  const minLeft = EDGE_MARGIN + edgePad - maxSize / 2;
  const maxRight = W - EDGE_MARGIN - edgePad + maxSize / 2;
  if (pieceStartX < minLeft) pieceStartX = minLeft;
  if (pieceStartX + pieceTotalW > maxRight) {
    pieceStartX = Math.max(minLeft, maxRight - pieceTotalW);
  }

  const pieceXPositions = [];
  let xCursor = pieceStartX;
  for (let i = 0; i < count; i++) {
    pieceXPositions.push(xCursor + placedSizes[i] / 2);
    xCursor += placedSizes[i] + pieceGap;
  }

  const pieces = shuffledRanks.map((rank, posIdx) => {
    const size = sizes[rank];
    const home = clampPieceCenter(
      pieceXPositions[posIdx],
      pieceCy,
      size,
      W,
      H,
      { visualScale: DRAG_SCALE, shakePad: SHAKE_PX },
    );
    return {
      id: `pc-${rank}`,
      rank,
      size,
      fill: color.fill,
      glow: color.glow,
      homeCx: home.cx,
      homeCy: home.cy,
      cx: home.cx,
      cy: home.cy,
      matched: false,
    };
  });

  return { slots, pieces, scale };
}
