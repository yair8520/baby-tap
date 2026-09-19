import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeBestStars,
  recordBestStars,
  starsFromMistakes,
  totalBestStars,
} from "./stars.js";

test("star scoring reflects mistakes", () => {
  assert.equal(starsFromMistakes(0), 3);
  assert.equal(starsFromMistakes(2), 2);
  assert.equal(starsFromMistakes(3), 1);
});

test("legacy and malformed star progress migrate safely", () => {
  assert.deepEqual(normalizeBestStars(14, 5), []);
  assert.deepEqual(normalizeBestStars([3, 9, 2, -1], 3), [3, 0, 2]);
  assert.deepEqual(normalizeBestStars([3, 2, 1], 2), [3, 2]);
});

test("recording stars keeps each level's best result", () => {
  const initial = recordBestStars([], 2, 2, 5);
  assert.deepEqual(initial, [0, 0, 2]);
  assert.deepEqual(recordBestStars(initial, 2, 1, 5), initial);
  assert.deepEqual(recordBestStars(initial, 2, 3, 5), [0, 0, 3]);
  assert.equal(totalBestStars([3, 0, 2], 5), 5);
});
