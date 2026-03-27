/**
 * Classic tap mode – level progression config.
 * Levels unlock as the player reaches combo milestones.
 */
export const CLASSIC_LEVELS = [
  {
    id: 1,
    minCombo: 0,
    label: { he: "מתחיל", en: "Beginner" },
    comboThresholds: { hot: 4, fire: 7, ultra: 10 },
    particleCount: 8,
    trailLength: 8,
  },
  {
    id: 2,
    minCombo: 10,
    label: { he: "מתקדם", en: "Intermediate" },
    comboThresholds: { hot: 3, fire: 6, ultra: 9 },
    particleCount: 10,
    trailLength: 10,
  },
  {
    id: 3,
    minCombo: 20,
    label: { he: "מומחה", en: "Expert" },
    comboThresholds: { hot: 2, fire: 5, ultra: 8 },
    particleCount: 12,
    trailLength: 12,
  },
];

export const COMBO_GAP_MS = 650; // ms gap to break combo
export const IDLE_TIMEOUT_MS = 6000;
export const PARTICLE_LIFE_MS = 900;
export const TRAIL_LIFE_MS = 600;
export const SPAWN_THROTTLE_MS = 50;
