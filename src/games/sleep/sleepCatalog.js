import { LULLABIES, LULLABY_IDS } from "./lullabies.js";

export { LULLABIES, LULLABY_IDS };

export const SLEEP_OPUS_URLS = {
  rain: new URL("../../assets/sounds/small_42-Rain-10min.opus", import.meta.url)
    .href,
  ocean: new URL(
    "../../assets/sounds/small_47-Waves-10min.opus",
    import.meta.url,
  ).href,
  // Storm recording — only for the storm mode (not "night wind").
  storm: new URL(
    "../../assets/sounds/small_24-Storm-10min.opus",
    import.meta.url,
  ).href,
  waterfall: new URL(
    "../../assets/sounds/small_32-Waterfall-10min.opus",
    import.meta.url,
  ).href,
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
