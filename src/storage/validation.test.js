import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidStoredValue,
  parseStoredValue,
} from "./validation.js";
import { clampLevelIndex } from "../games/levelUtils.js";
import { getShapesLevelIndex } from "../games/shapes/levels.js";

test("stored values support predicates, arrays, and sets", () => {
  assert.equal(isValidStoredValue(2, Number.isInteger), true);
  assert.equal(isValidStoredValue("ocean", ["rain", "ocean"]), true);
  assert.equal(isValidStoredValue("storm", ["rain", "ocean"]), false);
  assert.equal(isValidStoredValue("he", new Set(["he", "en"])), true);
});

test("stored JSON falls back when malformed or invalid", () => {
  assert.equal(parseStoredValue('"rain"', "ocean", ["rain", "ocean"]), "rain");
  assert.equal(parseStoredValue('"storm"', "ocean", ["rain", "ocean"]), "ocean");
  assert.equal(parseStoredValue("{", 3, Number.isInteger), 3);
});

test("level indexes clamp non-finite and out-of-range values", () => {
  assert.equal(clampLevelIndex(Number.NaN, 4), 0);
  assert.equal(clampLevelIndex(Infinity, 4), 0);
  assert.equal(clampLevelIndex(-2, 4), 0);
  assert.equal(clampLevelIndex(9, 4), 3);
  assert.equal(clampLevelIndex(2.8, 4), 2);
});

test("shapes level is derived from score thresholds", () => {
  assert.equal(getShapesLevelIndex(-1), 0);
  assert.equal(getShapesLevelIndex(4), 0);
  assert.equal(getShapesLevelIndex(5), 1);
  assert.equal(getShapesLevelIndex(55), 5);
  assert.equal(getShapesLevelIndex(80), 6);
});
