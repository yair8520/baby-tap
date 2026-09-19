import { useState, useRef, useEffect, useCallback } from "react";
import { ShapeGeom } from "../../components/ShapeGeom";
import { LearningGameShell, starsFromMistakes } from "../../components/LearningGameShell";
import {
  SHAPEMEMORY_LEVELS,
  getShapeMemoryLevel,
  buildSequence,
  buildPalette,
} from "./levels.js";
import { useGameBestStars, useGameLevel } from "../../hooks/useGameProgress.js";
import { buzz } from "../../components/LearningGameShell/vibrate.js";
import { useT } from "../../i18n";
import "./ShapeMemory.css";

function CountdownRing({ remaining, total }) {
  const R = 30;
  const circ = 2 * Math.PI * R;
  const progress = Math.max(0, remaining / total);
  const dash = circ * progress;
  return (
    <div className="mem-countdown-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={R}
          fill="none"
          stroke="#00E5FF"
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dasharray 0.9s linear" }}
        />
        <text
          x="40"
          y="46"
          textAnchor="middle"
          fill="white"
          fontSize="22"
          fontWeight="bold"
        >
          {Math.ceil(remaining)}
        </text>
      </svg>
    </div>
  );
}

/** One playable round; remount via `key` to rebuild the board without an effect. */
function ShapeMemoryRound({
  levelIdx,
  totalStars,
  onExit,
  onNextLevel,
  onReplay,
  isLastLevel,
  vibrateOn,
}) {
  const t = useT();
  const cfg = getShapeMemoryLevel(levelIdx);
  const totalShowSec = cfg.showMs / 1000;

  const [sequence] = useState(() => buildSequence(cfg));
  const [palette] = useState(() => buildPalette(sequence, cfg));
  const [phase, setPhase] = useState("show");
  const [userAnswers, setUserAnswers] = useState([]);
  const [countdown, setCountdown] = useState(totalShowSec);
  const [wrongSlot, setWrongSlot] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [slotGlow, setSlotGlow] = useState(null);

  const { recordStars } = useGameBestStars(
    "shapememory",
    SHAPEMEMORY_LEVELS.length,
  );

  const levelDoneRef = useRef(false);
  const intervalRef = useRef(null);
  const wrongTimerRef = useRef(null);

  useEffect(() => {
    if (phase !== "show") return;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 0.1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          setFading(true);
          setTimeout(() => {
            setPhase("recall");
            setFading(false);
          }, 500);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [phase]);

  const handlePaletteTap = useCallback(
    (item) => {
      if (levelDoneRef.current) return;

      const currentIdx = userAnswers.length;
      if (currentIdx >= sequence.length) return;

      const correct = sequence[currentIdx];

      if (item.shape === correct.shape && item.colorId === correct.colorId) {
        buzz([30, 20, 60], vibrateOn);

        const nextAnswers = [...userAnswers, item];
        setSlotGlow(currentIdx);
        setTimeout(() => setSlotGlow(null), 500);

        if (nextAnswers.length === sequence.length) {
          levelDoneRef.current = true;
          setUserAnswers(nextAnswers);
          recordStars(levelIdx, starsFromMistakes(mistakes));
          buzz([40, 30, 80, 30, 120], vibrateOn);
          setTimeout(() => setLevelDone(true), 600);
        } else {
          setUserAnswers(nextAnswers);
        }
      } else {
        buzz([80, 40, 80], vibrateOn);
        setWrongSlot(currentIdx);
        setMistakes((m) => m + 1);
        clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => {
          setWrongSlot(null);
          setUserAnswers([]);
        }, 600);
      }
    },
    [levelIdx, mistakes, recordStars, sequence, userAnswers, vibrateOn],
  );

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const starCount = starsFromMistakes(mistakes);
  const levelNum = levelIdx + 1;

  return (
    <div className="mem-root">
      <div className="mem-bg">
        <div className="mem-blob mem-blob1" />
        <div className="mem-blob mem-blob2" />
        <div className="mem-blob mem-blob3" />
      </div>

      <LearningGameShell
        levelNum={levelNum}
        totalStars={totalStars}
        onExit={onExit}
        levelDone={levelDone}
        starCount={starCount}
        onNextLevel={onNextLevel}
        onReplay={onReplay}
        isLastLevel={isLastLevel}
      >
        {phase === "show" && (
          <div className={`mem-show-area${fading ? " mem-fade-out" : ""}`}>
            <div className="mem-phase-label">{t("shapememory.memorize")}</div>
            <div className="mem-sequence-row">
              {sequence.map((item, i) => (
                <div
                  key={i}
                  className="mem-show-item"
                  style={{ "--item-delay": `${i * 0.1}s` }}
                >
                  <ShapeGeom
                    shape={item.shape}
                    size={80}
                    fill={item.fill}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={3}
                  />
                </div>
              ))}
            </div>
            <CountdownRing remaining={countdown} total={totalShowSec} />
          </div>
        )}

        {phase === "recall" && (
          <div className="mem-recall-area">
            <div className="mem-phase-label">{t("shapememory.recall")}</div>

            <div className="mem-slots-row">
              {sequence.map((item, i) => {
                const filled = userAnswers[i];
                const isCurrent = i === userAnswers.length;
                const isWrong = wrongSlot === i;
                const isGlow = slotGlow === i;
                return (
                  <div
                    key={i}
                    className={[
                      "mem-slot",
                      isCurrent && !filled ? "mem-slot-current" : "",
                      isWrong ? "mem-slot-wrong" : "",
                      isGlow ? "mem-slot-glow" : "",
                    ].join(" ")}
                  >
                    {filled ? (
                      <ShapeGeom
                        shape={filled.shape}
                        size={70}
                        fill={filled.fill}
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth={3}
                      />
                    ) : (
                      <div className="mem-slot-empty">
                        {isCurrent && <span className="mem-slot-pointer">▼</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mem-palette-grid">
              {palette.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="mem-palette-item"
                  onPointerDown={() => handlePaletteTap(item)}
                >
                  <ShapeGeom
                    shape={item.shape}
                    size={72}
                    fill={item.fill}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={3}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </LearningGameShell>
    </div>
  );
}

export default function ShapeMemory({ onExit, vibrateOn = true }) {
  const [levelIdx, setLevelIdx] = useGameLevel("shapememory", 0, {
    maxLevels: SHAPEMEMORY_LEVELS.length,
  });
  const [roundKey, setRoundKey] = useState(0);
  const { totalStars } = useGameBestStars(
    "shapememory",
    SHAPEMEMORY_LEVELS.length,
  );

  return (
    <ShapeMemoryRound
      key={`${levelIdx}-${roundKey}`}
      levelIdx={levelIdx}
      totalStars={totalStars}
      onExit={onExit}
      onNextLevel={() => setLevelIdx((p) => p + 1)}
      onReplay={() => setRoundKey((key) => key + 1)}
      isLastLevel={levelIdx === SHAPEMEMORY_LEVELS.length - 1}
      vibrateOn={vibrateOn}
    />
  );
}
