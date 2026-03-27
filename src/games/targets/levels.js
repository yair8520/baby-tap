/**
 * Targets game – difficulty levels based on score.
 */
export const TARGET_LEVELS = [
  {
    id: 1,
    minScore: 0,
    label: { he: "קל", en: "Easy" },
    durationMs: 3000,
    maxTargets: 2,
    spawnIntervalMs: 1800,
    minSize: 70,
    maxSize: 110,
  },
  {
    id: 2,
    minScore: 6,
    label: { he: "בינוני", en: "Medium" },
    durationMs: 2200,
    maxTargets: 3,
    spawnIntervalMs: 1400,
    minSize: 60,
    maxSize: 100,
  },
  {
    id: 3,
    minScore: 16,
    label: { he: "קשה", en: "Hard" },
    durationMs: 1600,
    maxTargets: 4,
    spawnIntervalMs: 1100,
    minSize: 55,
    maxSize: 90,
  },
  {
    id: 4,
    minScore: 30,
    label: { he: "מאתגר", en: "Expert" },
    durationMs: 1300,
    maxTargets: 5,
    spawnIntervalMs: 900,
    minSize: 50,
    maxSize: 80,
  },
  {
    id: 5,
    minScore: 50,
    label: { he: "אלוף", en: "Master" },
    durationMs: 1100,
    maxTargets: 6,
    spawnIntervalMs: 750,
    minSize: 45,
    maxSize: 75,
  },
];

export function getTargetLevelConfig(score) {
  let config = TARGET_LEVELS[0];
  for (const lvl of TARGET_LEVELS) {
    if (score >= lvl.minScore) config = lvl;
    else break;
  }
  return config;
}
