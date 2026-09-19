import test from "node:test";
import assert from "node:assert/strict";
import { STORAGE_KEYS } from "./keys.js";
import { clearStoredProgress, getProgressStorageKeys } from "./progress.js";

test("reset key list contains progress but excludes preferences", () => {
  const keys = getProgressStorageKeys();
  assert.ok(keys.includes(`bt_${STORAGE_KEYS.shapematchStars}`));
  assert.ok(keys.includes(`bt_${STORAGE_KEYS.targetHighScore}`));
  assert.ok(!keys.includes(`bt_${STORAGE_KEYS.lang}`));
  assert.ok(!keys.includes(`bt_${STORAGE_KEYS.theme}`));
  assert.ok(!keys.includes(`bt_${STORAGE_KEYS.muteOn}`));
  assert.ok(!keys.includes(`bt_${STORAGE_KEYS.vibrateOn}`));
});

test("clearing progress removes only declared storage keys", () => {
  const removed = [];
  clearStoredProgress({ removeItem: (key) => removed.push(key) });
  assert.deepEqual(removed, getProgressStorageKeys());
});
