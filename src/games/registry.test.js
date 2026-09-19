import test from "node:test";
import assert from "node:assert/strict";
import {
  GAMES,
  PLAY,
  LEARNING,
  DEFAULT_GAME_ID,
  GAME_MODE_IDS,
  getGame,
  gamesByCategory,
} from "./registry.js";

test("registry lists every mode once with stable ids", () => {
  const ids = GAMES.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(GAME_MODE_IDS, ids);
  assert.ok(ids.includes(DEFAULT_GAME_ID));
});

test("getGame falls back to the default mode", () => {
  assert.equal(getGame("classic").id, "classic");
  assert.equal(getGame("nope").id, DEFAULT_GAME_ID);
});

test("play and learning categories cover the full registry", () => {
  const play = gamesByCategory(PLAY);
  const learning = gamesByCategory(LEARNING);
  assert.ok(play.length >= 5);
  assert.ok(learning.length >= 8);
  assert.equal(play.length + learning.length, GAMES.length);
  assert.ok(play.every((g) => g.category === PLAY));
  assert.ok(learning.every((g) => g.category === LEARNING));
});

test("every registry entry exposes a lazy Component and props adapter", () => {
  for (const game of GAMES) {
    assert.equal(typeof game.Component, "object");
    assert.equal(typeof game.props, "function");
    assert.ok(game.emoji);
    assert.ok(game.i18nKey.includes("."));
  }
});
