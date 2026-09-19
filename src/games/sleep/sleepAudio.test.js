import test from "node:test";
import assert from "node:assert/strict";
import {
  LULLABIES,
  LULLABY_IDS,
  MELODY_SOUNDS,
  NOISE_SOUNDS,
  SLEEP_OPUS_URLS,
  SLEEP_SOUND_MODES,
} from "./sleepCatalog.js";

test("each lullaby is a distinct multi-note motif", () => {
  assert.deepEqual(LULLABY_IDS, ["lullaby", "lullaby2", "lullaby3"]);
  const fingerprints = LULLABY_IDS.map((id) => LULLABIES[id].notes.join(","));
  assert.equal(new Set(fingerprints).size, fingerprints.length);
  for (const id of LULLABY_IDS) {
    const song = LULLABIES[id];
    assert.ok(song.notes.length >= 12);
    assert.ok(song.noteDur > 0.2);
    assert.ok(song.peakGain > 0.05);
    assert.ok(song.notes.every((hz) => Number.isFinite(hz) && hz > 0));
  }
});

test("recorded ambience maps only to matching nature modes", () => {
  assert.deepEqual(Object.keys(SLEEP_OPUS_URLS).sort(), [
    "ocean",
    "rain",
    "storm",
    "waterfall",
  ]);
  assert.equal("wind" in SLEEP_OPUS_URLS, false);
  for (const url of Object.values(SLEEP_OPUS_URLS)) {
    assert.match(url, /\.opus/);
  }
});

test("sleep catalogs cover every mode id exactly once", () => {
  const catalogIds = [
    ...NOISE_SOUNDS.map((s) => s.id),
    ...MELODY_SOUNDS.map((s) => s.id),
  ];
  assert.deepEqual([...catalogIds].sort(), [...SLEEP_SOUND_MODES].sort());
  assert.equal(new Set(catalogIds).size, catalogIds.length);
});
