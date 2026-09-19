/**
 * Sleep lullabies as [freqHz, beats] sequences.
 * freq 0 = rest. Kept free of Web Audio so motifs stay unit-testable.
 */

const G3 = 196.0;
const A3 = 220.0;
const B3 = 246.94;
const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const G4 = 392.0;
const A4 = 440.0;

export const LULLABIES = {
  /** Twinkle Twinkle Little Star */
  lullaby: {
    bpm: 88,
    peakGain: 0.28,
    notes: [
      [C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
      [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
      [G4, 1], [G4, 1], [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 2],
      [G4, 1], [G4, 1], [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 2],
      [C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
      [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
      [0, 2],
    ],
  },
  /** Brahms' Lullaby (simplified opening) */
  lullaby2: {
    bpm: 72,
    peakGain: 0.26,
    notes: [
      [E4, 1], [E4, 1], [G4, 2],
      [E4, 1], [E4, 1], [G4, 2],
      [E4, 1], [G4, 1], [C4, 1.5], [B3, 0.5], [A3, 2],
      [D4, 1], [F4, 1], [B3, 1.5], [A3, 0.5], [G3, 2],
      [E4, 1], [E4, 1], [G4, 2],
      [E4, 1], [E4, 1], [G4, 2],
      [E4, 1], [G4, 1], [C4, 1.5], [B3, 0.5], [A3, 2],
      [D4, 1], [F4, 1], [B3, 1], [D4, 1], [C4, 2],
      [0, 2],
    ],
  },
  /** Frère Jacques */
  lullaby3: {
    bpm: 96,
    peakGain: 0.28,
    notes: [
      [C4, 1], [D4, 1], [E4, 1], [C4, 1],
      [C4, 1], [D4, 1], [E4, 1], [C4, 1],
      [E4, 1], [F4, 1], [G4, 2],
      [E4, 1], [F4, 1], [G4, 2],
      [G4, 0.5], [A4, 0.5], [G4, 0.5], [F4, 0.5], [E4, 1], [C4, 1],
      [G4, 0.5], [A4, 0.5], [G4, 0.5], [F4, 0.5], [E4, 1], [C4, 1],
      [C4, 1], [G3, 1], [C4, 2],
      [C4, 1], [G3, 1], [C4, 2],
      [0, 2],
    ],
  },
};

export const LULLABY_IDS = Object.keys(LULLABIES);

/** Flatten notes to Hz list for fingerprint tests (skips rests). */
export function lullabyHzFingerprint(song) {
  return song.notes
    .filter(([hz]) => hz > 0)
    .map(([hz]) => Math.round(hz))
    .join(",");
}

export function lullabyBeatSeconds(song) {
  return 60 / song.bpm;
}
