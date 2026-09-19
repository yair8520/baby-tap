/**
 * Targets game – difficulty levels based on score.
 * Add rows to TARGET_LEVELS (sorted by minScore) to extend difficulty.
 */
import { getLevelByThreshold } from "../levelUtils.js";

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
  {
    id: 6,
    minScore: 75,
    label: { he: "ספיד", en: "Speed" },
    durationMs: 1000,
    maxTargets: 6,
    spawnIntervalMs: 680,
    minSize: 42,
    maxSize: 70,
  },
  {
    id: 7,
    minScore: 105,
    label: { he: "פרו", en: "Pro" },
    durationMs: 900,
    maxTargets: 7,
    spawnIntervalMs: 620,
    minSize: 40,
    maxSize: 65,
  },
  {
    id: 8,
    minScore: 140,
    label: { he: "אגדה", en: "Legend" },
    durationMs: 800,
    maxTargets: 8,
    spawnIntervalMs: 560,
    minSize: 38,
    maxSize: 60,
  },
];

export function getTargetLevelConfig(score) {
  return getLevelByThreshold(TARGET_LEVELS, score, "minScore");
}
