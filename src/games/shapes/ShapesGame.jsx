import { useState, useEffect, useCallback } from "react";
import { SHAPES_LEVELS, SHAPE_COLORS, SHAPE_TYPES, generateChallenge } from "./levels.js";
import "./ShapesGame.css";

function ShapeIcon({ shape, color, size = 80 }) {
  const hex = SHAPE_COLORS[color]?.hex ?? "#fff";
  const s = size;

  switch (shape) {
    case "circle":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill={hex} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        </svg>
      );
    case "square":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="10" y="10" width="80" height="80" rx="10" ry="10"
            fill={hex} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        </svg>
      );
    case "triangle":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="50,8 92,88 8,88"
            fill={hex} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
            fill={hex} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        </svg>
      );
    case "heart":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path
            d="M50 80 C10 55 5 20 25 12 C35 8 45 14 50 22 C55 14 65 8 75 12 C95 20 90 55 50 80Z"
            fill={hex} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ShapesGame({ lang, onSound }) {
  const isHe = lang === "he";
  const L = (he, en) => (isHe ? he : en);

  const [score, setScore] = useState(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [feedback, setFeedback] = useState(null); // { correct: bool, shapeId }
  const [locked, setLocked] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);

  const currentLevel = SHAPES_LEVELS[levelIdx];

  const nextChallenge = useCallback((lvlConfig) => {
    setChallenge(generateChallenge(lvlConfig));
    setFeedback(null);
    setLocked(false);
  }, []);

  useEffect(() => {
    nextChallenge(currentLevel);
  }, [levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Advance level based on score
  useEffect(() => {
    const nextLvlIdx = SHAPES_LEVELS.findIndex((lvl, i) =>
      i === SHAPES_LEVELS.length - 1
        ? true
        : score < SHAPES_LEVELS[i + 1 > 0 ? i : 0].scoreToAdvance
    );
    const targetIdx = Math.min(
      SHAPES_LEVELS.filter((_, i) => {
        // cumulative score thresholds
        let threshold = 0;
        for (let j = 0; j <= i; j++) threshold += (SHAPES_LEVELS[j - 1]?.scoreToAdvance ?? 0);
        return score >= (SHAPES_LEVELS[i]?.scoreToAdvance ?? Infinity) ? false : true;
      }).length,
      SHAPES_LEVELS.length - 1
    );
    void nextLvlIdx; // suppress lint

    // Simple: advance when score crosses current level's threshold
    if (
      levelIdx < SHAPES_LEVELS.length - 1 &&
      score >= currentLevel.scoreToAdvance
    ) {
      setLevelIdx((i) => {
        const ni = Math.min(i + 1, SHAPES_LEVELS.length - 1);
        setLevelUpFlash(true);
        setTimeout(() => {
          setLevelUpFlash(false);
          nextChallenge(SHAPES_LEVELS[ni]);
        }, 1200);
        return ni;
      });
    }
  }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = useCallback((shapeItem) => {
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

    setTimeout(() => {
      nextChallenge(currentLevel);
    }, 700);
  }, [locked, challenge, currentLevel, nextChallenge, onSound]);

  if (!challenge) return null;

  const targetColorLabel = isHe
    ? SHAPE_COLORS[challenge.targetColor]?.he
    : SHAPE_COLORS[challenge.targetColor]?.en;
  const targetShapeLabel = isHe
    ? SHAPE_TYPES[challenge.targetShape]?.he
    : SHAPE_TYPES[challenge.targetShape]?.en;

  // Responsive shape size
  const shapeSize = Math.min(
    Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.18),
    88
  );

  return (
    <div className="sg-root" dir={isHe ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sg-header">
        <span className="sg-level-badge">
          {L(`רמה ${currentLevel.id}`, `Level ${currentLevel.id}`)}
        </span>
        <span className="sg-score">
          {L(`ניקוד: ${score}`, `Score: ${score}`)}
        </span>
      </div>

      {/* Level-up flash */}
      {levelUpFlash && (
        <div className="sg-levelup">
          {L(`🎉 רמה ${currentLevel.id}!`, `🎉 Level ${currentLevel.id}!`)}
        </div>
      )}

      {/* Instruction */}
      <div className="sg-instruction">
        <span className="sg-instruction-tap">{L("גע ב", "Tap the")}</span>
        <span className="sg-target-color" style={{ color: SHAPE_COLORS[challenge.targetColor]?.hex }}>
          {targetColorLabel}
        </span>
        <span className="sg-target-shape">{targetShapeLabel}!</span>
      </div>

      {/* Shapes grid */}
      <div className="sg-grid" style={{ "--cols": Math.ceil(Math.sqrt(challenge.shapes.length)) }}>
        {challenge.shapes.map((item) => {
          const isFeedback = feedback && feedback.shapeId === item.id;
          return (
            <button
              key={item.id}
              className={`sg-shape-btn${isFeedback ? (feedback.correct ? " sg-correct" : " sg-wrong") : ""}`}
              onTouchEnd={(e) => { e.preventDefault(); handleTap(item); }}
              onMouseUp={() => handleTap(item)}
              aria-label={`${item.color} ${item.shape}`}
            >
              <ShapeIcon shape={item.shape} color={item.color} size={shapeSize} />
            </button>
          );
        })}
      </div>

      {/* Level dots */}
      <div className="sg-level-dots">
        {SHAPES_LEVELS.map((lvl, i) => (
          <div
            key={lvl.id}
            className={`sg-dot${i === levelIdx ? " sg-dot--active" : ""}${i > levelIdx ? " sg-dot--locked" : " sg-dot--done"}`}
          />
        ))}
      </div>
    </div>
  );
}
