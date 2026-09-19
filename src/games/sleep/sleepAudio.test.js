import test from "node:test";
import assert from "node:assert/strict";
import {
  LULLABIES,
  LULLABY_IDS,
  lullabyBeatSeconds,
  lullabyHzFingerprint,
} from "./lullabies.js";
import {
  MELODY_SOUNDS,
  NOISE_SOUNDS,
  SLEEP_OPUS_URLS,
  SLEEP_SOUND_MODES,
} from "./sleepCatalog.js";

test("each lullaby is a distinct multi-note motif with rhythm", () => {
  assert.deepEqual(LULLABY_IDS, ["lullaby", "lullaby2", "lullaby3"]);
  const fingerprints = LULLABY_IDS.map((id) =>
    lullabyHzFingerprint(LULLABIES[id]),
  );
  assert.equal(new Set(fingerprints).size, fingerprints.length);
  for (const id of LULLABY_IDS) {
    const song = LULLABIES[id];
    assert.ok(song.notes.length >= 12);
    assert.ok(song.bpm >= 60 && song.bpm <= 140);
    assert.ok(lullabyBeatSeconds(song) > 0);
    assert.ok(song.peakGain > 0.1);
    assert.ok(
      song.notes.every(
        ([hz, beats]) =>
          Number.isFinite(hz) &&
          hz >= 0 &&
          Number.isFinite(beats) &&
          beats > 0,
      ),
    );
    assert.ok(song.notes.some(([hz]) => hz > 0));
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
