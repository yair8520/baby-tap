import { describe, it, expect } from "vitest";
import {
  clampLevelIndex,
  getLevelByIndex,
  getLevelByThreshold,
  levelNumber,
  levelCount,
} from "./levelUtils.js";
import { listProgressKeys } from "../storage/resetProgress.js";
import { MODE_LEVEL_KEYS } from "../storage/keys.js";
import { getT } from "../i18n/index.js";
import { starsFromMistakes } from "../components/LearningGameShell/stars.js";
import { COLORMIX_LEVELS } from "./colormix/levels.js";
import { SIZESORT_LEVELS } from "./sizesort/levels.js";
import { SHAPEMATCH_LEVELS } from "./shapematch/levels.js";
import { BALLOON_LEVELS } from "./balloons/levels.js";

describe("levelUtils", () => {
  const levels = [
    { id: 1, minScore: 0 },
    { id: 2, minScore: 10 },
    { id: 3, minScore: 30 },
  ];

  it("clamps index", () => {
    expect(clampLevelIndex(-1, 3)).toBe(0);
    expect(clampLevelIndex(99, 3)).toBe(2);
  });

  it("gets by index", () => {
    expect(getLevelByIndex(levels, 1).id).toBe(2);
  });

  it("gets by threshold", () => {
    expect(getLevelByThreshold(levels, 0).id).toBe(1);
    expect(getLevelByThreshold(levels, 10).id).toBe(2);
    expect(getLevelByThreshold(levels, 100).id).toBe(3);
  });

  it("level helpers", () => {
    expect(levelNumber(0, 5)).toBe(1);
    expect(levelCount(levels)).toBe(3);
  });
});

describe("campaign depth", () => {
  it("learning + balloons have at least 15 stages", () => {
    expect(COLORMIX_LEVELS.length).toBeGreaterThanOrEqual(15);
    expect(SIZESORT_LEVELS.length).toBeGreaterThanOrEqual(15);
    expect(SHAPEMATCH_LEVELS.length).toBeGreaterThanOrEqual(15);
    expect(BALLOON_LEVELS.length).toBeGreaterThanOrEqual(15);
  });
});

describe("storage keys", () => {
  it("lists unique progress keys covering modes", () => {
    const keys = listProgressKeys();
    expect(keys).toContain("balloonLevel");
    expect(keys).toContain("memoryLevel");
    expect(keys).toContain(MODE_LEVEL_KEYS.shapematch);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("i18n", () => {
  it("translates with Baby Tap brand", () => {
    expect(getT("en")("common.title")).toContain("Baby Tap");
    expect(getT("he")("common.title")).toContain("Baby Tap");
  });

  it("interpolates vars", () => {
    expect(getT("en")("balloons.level", { level: 3 })).toBe("Lv 3");
  });

  it("has learning mode labels", () => {
    expect(getT("en")("learning.colormix")).toBe("Mix Colors");
    expect(getT("he")("learning.sizesort")).toBe("מיון גדלים");
  });
});

describe("starsFromMistakes", () => {
  it("maps mistakes to stars", () => {
    expect(starsFromMistakes(0)).toBe(3);
    expect(starsFromMistakes(2)).toBe(2);
    expect(starsFromMistakes(5)).toBe(1);
  });
});
