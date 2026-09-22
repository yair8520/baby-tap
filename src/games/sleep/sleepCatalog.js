import { LULLABIES, LULLABY_IDS } from "./lullabies.js";

export { LULLABIES, LULLABY_IDS };

// Short, normalized, seamless loops derived from the existing nature recordings.
export const SLEEP_RECORDINGS = {
  rain: new URL("../../assets/sounds/rain.mp3", import.meta.url).href,
  ocean: new URL("../../assets/sounds/ocean.mp3", import.meta.url).href,
  storm: new URL("../../assets/sounds/storm.mp3", import.meta.url).href,
  waterfall: new URL("../../assets/sounds/waterfall.mp3", import.meta.url).href,
};

export const SLEEP_SOUND_MODES = [
  "rain",
  "ocean",
  "wind",
  "storm",
  "waterfall",
  "white",
  "pink",
  "brown",
  "heartbeat",
  ...LULLABY_IDS,
];

export const NOISE_SOUNDS = [
  { id: "rain", emoji: "🌧️", i18nKey: "sleep.sounds.rain" },
  { id: "ocean", emoji: "🌊", i18nKey: "sleep.sounds.ocean" },
  { id: "wind", emoji: "🍃", i18nKey: "sleep.sounds.wind" },
  { id: "storm", emoji: "⛈️", i18nKey: "sleep.sounds.storm" },
  { id: "waterfall", emoji: "🏞️", i18nKey: "sleep.sounds.waterfall" },
  { id: "white", emoji: "🌫️", i18nKey: "sleep.sounds.white" },
  { id: "pink", emoji: "🩵", i18nKey: "sleep.sounds.pink" },
  { id: "brown", emoji: "🌲", i18nKey: "sleep.sounds.brown" },
  { id: "heartbeat", emoji: "💗", i18nKey: "sleep.sounds.heartbeat" },
];

export const MELODY_SOUNDS = [
  { id: "lullaby", emoji: "⭐", i18nKey: "sleep.sounds.lullaby" },
  { id: "lullaby2", emoji: "🎶", i18nKey: "sleep.sounds.lullaby2" },
  { id: "lullaby3", emoji: "🔔", i18nKey: "sleep.sounds.lullaby3" },
];
