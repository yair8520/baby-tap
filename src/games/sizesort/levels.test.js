import test from "node:test";
import assert from "node:assert/strict";
import {
  SIZES,
  SIZESORT_LEVELS,
  SLOT_PAD,
  MATCH_POP_SCALE,
  DRAG_SCALE,
  SHAKE_PX,
  EDGE_MARGIN,
  TOP_CHROME,
  computeLayoutScale,
  clampPieceCenter,
  buildLevel,
} from "./levels.js";

const VIEWPORTS = [
  { name: "iphone-se-portrait", W: 320, H: 568 },
  { name: "iphone-se-landscape", W: 568, H: 320 },
  { name: "small-phone", W: 360, H: 640 },
  { name: "short-landscape", W: 667, H: 280 },
  { name: "tablet", W: 768, H: 1024 },
];

function assertInBounds(levelIdx, W, H) {
  // Deterministic shuffle for assertions: stub Math.random
  const rand = Math.random;
  let i = 0;
  const seq = [0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4, 0.6];
  Math.random = () => seq[i++ % seq.length];
  try {
    const { slots, pieces, scale } = buildLevel(levelIdx, W, H);
    assert.ok(scale > 0 && scale <= 1);

    for (const sl of slots) {
      const popR = (sl.slotD / 2) * MATCH_POP_SCALE;
      assert.ok(
        sl.cx - popR >= EDGE_MARGIN - 0.5,
        `slot ${sl.id} left overflow @${W}x${H}`,
      );
      assert.ok(
        sl.cx + popR <= W - EDGE_MARGIN + 0.5,
        `slot ${sl.id} right overflow @${W}x${H}`,
      );
      assert.ok(
        sl.cy - popR >= TOP_CHROME - 0.5,
        `slot ${sl.id} top overflow @${W}x${H}`,
      );
      assert.ok(
        sl.cy + popR <= H - EDGE_MARGIN + 0.5,
        `slot ${sl.id} bottom overflow @${W}x${H}`,
      );
    }

    for (const pc of pieces) {
      const dragR = (pc.size / 2) * DRAG_SCALE;
      assert.ok(
        pc.homeCx - dragR - SHAKE_PX >= EDGE_MARGIN - 0.5,
        `piece ${pc.id} left overflow @${W}x${H}`,
      );
      assert.ok(
        pc.homeCx + dragR + SHAKE_PX <= W - EDGE_MARGIN + 0.5,
        `piece ${pc.id} right overflow @${W}x${H}`,
      );
      assert.ok(
        pc.homeCy - dragR >= TOP_CHROME - 0.5,
        `piece ${pc.id} top overflow @${W}x${H}`,
      );
      assert.ok(
        pc.homeCy + dragR <= H - EDGE_MARGIN + 0.5,
        `piece ${pc.id} bottom overflow @${W}x${H}`,
      );
    }

    // Sizes stay clearly distinct after scaling
    const sizes = [...new Set(pieces.map((p) => p.size))].sort((a, b) => a - b);
    for (let j = 1; j < sizes.length; j++) {
      assert.ok(sizes[j] > sizes[j - 1], "scaled sizes must stay ordered");
    }
  } finally {
    Math.random = rand;
  }
}

test("computeLayoutScale shrinks for narrow phones with 5 pieces", () => {
  const scale = computeLayoutScale(5, 320, 568);
  assert.ok(scale < 1);
  assert.ok(scale > 0.2);
});

test("computeLayoutScale stays 1 on large screens", () => {
  const scale = computeLayoutScale(3, 1200, 900);
  assert.equal(scale, 1);
});

test("clampPieceCenter keeps dragged pieces on-screen", () => {
  const size = 100;
  const W = 360;
  const H = 640;
  const out = clampPieceCenter(-50, 9999, size, W, H);
  const r = (size / 2) * DRAG_SCALE;
  assert.equal(out.cx, EDGE_MARGIN + r);
  assert.equal(out.cy, H - EDGE_MARGIN - r);
});

test("buildLevel fits portrait and landscape viewports for all counts", () => {
  for (const { W, H } of VIEWPORTS) {
    for (const count of [3, 4, 5]) {
      const levelIdx = SIZESORT_LEVELS.findIndex((l) => l.count === count);
      assertInBounds(levelIdx, W, H);
    }
  }
});

test("design sizes remain the reference before scaling", () => {
  assert.deepEqual(SIZES[5], [40, 60, 80, 100, 120]);
  assert.equal(SLOT_PAD, 20);
});
