/**
 * Distinct sleep lullaby motifs (Hz). Kept separate so melodies stay
 * recognizable and testable without Web Audio.
 */
export const LULLABIES = {
  /** Twinkle Twinkle Little Star */
  lullaby: {
    notes: [
      262, 262, 392, 392, 440, 440, 392,
      349, 349, 330, 330, 294, 294, 262,
      392, 392, 349, 349, 330, 330, 294,
      392, 392, 349, 349, 330, 330, 294,
      262, 262, 392, 392, 440, 440, 392,
      349, 349, 330, 330, 294, 294, 262,
    ],
    noteDur: 0.52,
    peakGain: 0.2,
  },
  /** Brahms' Lullaby (opening phrase, simplified) */
  lullaby2: {
    notes: [
      392, 392, 440, 392, 349, 330, 294,
      392, 392, 440, 392, 349, 330, 294,
      330, 330, 349, 392, 440, 392, 349,
      330, 294, 262, 294, 330, 294, 262,
    ],
    noteDur: 0.58,
    peakGain: 0.19,
  },
  /** Frère Jacques */
  lullaby3: {
    notes: [
      262, 294, 330, 262,
      262, 294, 330, 262,
      330, 349, 392,
      330, 349, 392,
      392, 440, 392, 349, 330, 262,
      392, 440, 392, 349, 330, 262,
      262, 196, 262,
      262, 196, 262,
    ],
    noteDur: 0.42,
    peakGain: 0.2,
  },
};

export const LULLABY_IDS = Object.keys(LULLABIES);
