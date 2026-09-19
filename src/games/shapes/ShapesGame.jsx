import { useState, useEffect, useCallback, useRef } from "react";
import { LearningGameShell } from "../../components/LearningGameShell";
import {
  SHAPES_LEVELS,
  SHAPE_COLORS,
  generateChallenge,
  getShapesLevelIndex,
} from "./levels.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { isNonNegativeInteger } from "../../storage/validation.js";
import { useT } from "../../i18n";
import "./ShapesGame.css";

function ShapeIcon({ shape, color, size = 80 }) {
  const hex = SHAPE_COLORS[color]?.hex ?? "#fff";
  const s = size;

  switch (shape) {
    case "circle":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill={hex}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
        </svg>
      );
    case "square":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            rx="10"
            ry="10"
            fill={hex}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
        </svg>
      );
    case "triangle":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,8 92,88 8,88"
            fill={hex}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
            fill={hex}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
        </svg>
      );
    case "heart":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path
            d="M50 80 C10 55 5 20 25 12 C35 8 45 14 50 22 C55 14 65 8 75 12 C95 20 90 55 50 80Z"
            fill={hex}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function ShapesGame({ onExit, onSound }) {
  const t = useT();
  const [score, setScore] = useLocalStorage(
    STORAGE_KEYS.shapesScore,
    0,
    isNonNegativeInteger,
  );
  const levelIdx = getShapesLevelIndex(score);
  const [challenge, setChallenge] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const timersRef = useRef(new Set());
  const previousLevelRef = useRef(levelIdx);

  const currentLevel = SHAPES_LEVELS[levelIdx];

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current.clear();
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);
    timersRef.current.add(timerId);
  }, []);

  const nextChallenge = useCallback((lvlConfig) => {
    setChallenge(generateChallenge(lvlConfig));
    setFeedback(null);
    setLocked(false);
  }, []);

  useEffect(() => {
    clearTimers();
    const levelChanged = previousLevelRef.current !== levelIdx;
    previousLevelRef.current = levelIdx;
    schedule(() => {
      nextChallenge(currentLevel);
      if (levelChanged) {
        setLevelUpFlash(true);
        schedule(() => setLevelUpFlash(false), 1200);
      }
    }, 0);
  }, [clearTimers, currentLevel, levelIdx, nextChallenge, schedule]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleTap = useCallback(
    (shapeItem) => {
      if (locked || !challenge) return;
      setLocked(true);

      const correct =
        shapeItem.color === challenge.targetColor &&
        shapeItem.shape === challenge.targetShape;

      setFeedback({ correct, shapeId: shapeItem.id });

      if (correct) {
        onSound?.("match");
        setScore((s) => s + 1);
      } else {
        onSound?.("miss");
      }

      schedule(() => {
        nextChallenge(currentLevel);
      }, 700);
    },
    [locked, challenge, currentLevel, nextChallenge, onSound, schedule, setScore],
  );

  if (!challenge) return null;

  const targetColorLabel = t(`shapes.colors.${challenge.targetColor}`);
  const targetShapeLabel = t(`shapes.shapeNames.${challenge.targetShape}`);
  const shapeSize = Math.min(
    Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.18),
    88,
  );

  return (
    <div className="sg-root">
      <LearningGameShell
        levelNum={currentLevel.id}
        totalLevels={SHAPES_LEVELS.length}
        maxUnlocked={levelIdx}
        onExit={onExit}
        maxStars={0}
        headerTrailing={t("shapes.score", { score })}
      >
        {levelUpFlash && (
          <div className="sg-levelup">
            {t("shapes.levelUp", { level: currentLevel.id })}
          </div>
        )}

        <div className="sg-instruction">
          <span className="sg-instruction-tap">{t("shapes.tap")}</span>
          <span
            className="sg-target-color"
            style={{ color: SHAPE_COLORS[challenge.targetColor]?.hex }}
          >
            {targetColorLabel}
          </span>
          <span className="sg-target-shape">{targetShapeLabel}!</span>
        </div>

        <div
          className="sg-grid"
          style={{ "--cols": Math.ceil(Math.sqrt(challenge.shapes.length)) }}
        >
          {challenge.shapes.map((item) => {
            const isFeedback = feedback && feedback.shapeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sg-shape-btn${isFeedback ? (feedback.correct ? " sg-correct" : " sg-wrong") : ""}`}
                onPointerUp={() => handleTap(item)}
                aria-label={`${item.color} ${item.shape}`}
              >
                <ShapeIcon
                  shape={item.shape}
                  color={item.color}
                  size={shapeSize}
                />
              </button>
            );
          })}
        </div>
      </LearningGameShell>
    </div>
  );
}
