import test from "node:test";
import assert from "node:assert/strict";
import {
  clampLevelIndex,
  getLevelByIndex,
  getLevelByThreshold,
  levelNumber,
  levelCount,
} from "./levelUtils.js";
import { listProgressKeys } from "../storage/resetProgress.js";
import { MODE_LEVEL_KEYS } from "../storage/keys.js";
import { starsFromMistakes } from "../components/LearningGameShell/stars.js";
import { COLORMIX_LEVELS } from "./colormix/levels.js";
import { SIZESORT_LEVELS } from "./sizesort/levels.js";
import { SHAPEMATCH_LEVELS } from "./shapematch/levels.js";
import { BALLOON_LEVELS } from "./balloons/levels.js";

test("level utilities clamp and select levels", () => {
  const levels = [
    { id: 1, minScore: 0 },
    { id: 2, minScore: 10 },
    { id: 3, minScore: 30 },
  ];

  assert.equal(clampLevelIndex(-1, 3), 0);
  assert.equal(clampLevelIndex(99, 3), 2);
  assert.equal(getLevelByIndex(levels, 1).id, 2);
  assert.equal(getLevelByThreshold(levels, 0).id, 1);
  assert.equal(getLevelByThreshold(levels, 10).id, 2);
  assert.equal(getLevelByThreshold(levels, 100).id, 3);
  assert.equal(levelNumber(0, 5), 1);
  assert.equal(levelCount(levels), 3);
});

test("campaigns include at least 15 stages", () => {
  assert.ok(COLORMIX_LEVELS.length >= 15);
  assert.ok(SIZESORT_LEVELS.length >= 15);
  assert.ok(SHAPEMATCH_LEVELS.length >= 15);
  assert.ok(BALLOON_LEVELS.length >= 15);
});

test("progress storage keys cover modes without duplicates", () => {
  const keys = listProgressKeys();
  assert.ok(keys.includes("balloonLevel"));
  assert.ok(keys.includes("memoryLevel"));
  assert.ok(keys.includes(MODE_LEVEL_KEYS.shapematch));
  assert.equal(new Set(keys).size, keys.length);
});

test("mistakes map to star ratings", () => {
  assert.equal(starsFromMistakes(0), 3);
  assert.equal(starsFromMistakes(2), 2);
  assert.equal(starsFromMistakes(5), 1);
});
