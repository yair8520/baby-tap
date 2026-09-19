import { useState, useEffect, useCallback, useRef } from "react";
import { LearningGameShell } from "../../components/LearningGameShell";
import { MEMORY_LEVELS, buildDeck } from "./levels.js";
import { useGameLevel } from "../../hooks/useGameProgress.js";
import { useT } from "../../i18n";
import "./MemoryGame.css";

/** Compute the largest square card that fits both screen width & height */
function useCardSize(cols, rows) {
  const [size, setSize] = useState(80);

  useEffect(() => {
    function compute() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const verticalChrome = 58 + 40 + 10 + 26 + 8;
      const horizontalPad = 24;
      const gapH = Math.min(10, Math.max(5, vw * 0.018));
      const gapV = Math.min(10, Math.max(5, vh * 0.012));
      const availW = vw - horizontalPad - gapH * (cols - 1);
      const availH = vh - verticalChrome - gapV * (rows - 1);
      setSize(Math.min(Math.floor(availW / cols), Math.floor(availH / rows), 120));
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [cols, rows]);

  return size;
}

export default function MemoryGame({ onExit, onSound }) {
  const t = useT();
  const [levelIdx, setLevelIdx] = useGameLevel("memory", 0, {
    maxLevels: MEMORY_LEVELS.length,
  });
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const timersRef = useRef(new Set());

  const currentLevel = MEMORY_LEVELS[levelIdx];
  const cardSize = useCardSize(currentLevel.cols, currentLevel.rows);

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

  const startLevel = useCallback(
    (idx) => {
      clearTimers();
      setCards(buildDeck(MEMORY_LEVELS[idx]));
      setFlipped([]);
      setMatched(new Set());
      setAttempts(0);
      setWon(false);
      setLocked(false);
      setFeedback(null);
    },
    [clearTimers],
  );

  useEffect(() => {
    clearTimers();
    schedule(() => startLevel(levelIdx), 0);
  }, [clearTimers, levelIdx, schedule, startLevel]);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleCardTap = useCallback(
    (cardId) => {
      if (locked) return;
      if (matched.has(cardId)) return;
      if (flipped.includes(cardId)) return;
      if (flipped.length >= 2) return;

      const newFlipped = [...flipped, cardId];
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setAttempts((a) => a + 1);
        setLocked(true);

        const [a, b] = newFlipped.map((id) => cards.find((c) => c.id === id));
        if (a.pairId === b.pairId) {
          schedule(() => {
            setFeedback("correct");
            onSound?.("match");
            const newMatched = new Set([...matched, a.id, b.id]);
            setMatched(newMatched);
            setFlipped([]);
            setLocked(false);
            schedule(() => setFeedback(null), 700);
            if (newMatched.size === cards.length) setWon(true);
          }, 400);
        } else {
          schedule(() => {
            setFeedback("wrong");
            onSound?.("miss");
            schedule(() => {
              setFlipped([]);
              setLocked(false);
              setFeedback(null);
            }, 400);
          }, 700);
        }
      }
    },
    [locked, matched, flipped, cards, onSound, schedule],
  );

  const isFlipped = (id) => flipped.includes(id) || matched.has(id);
  const emojiFontSize = Math.max(16, Math.floor(cardSize * 0.52));
  const gapPx = Math.min(10, Math.max(5, cardSize * 0.08));
  const matches = matched.size / 2;

  return (
    <div className="mg-root">
      <LearningGameShell
        levelNum={currentLevel.id}
        totalLevels={MEMORY_LEVELS.length}
        maxUnlocked={Math.min(levelIdx + 1, MEMORY_LEVELS.length - 1)}
        onSelectLevel={(i) => {
          clearTimers();
          setLevelIdx(i);
        }}
        onExit={onExit}
        levelDone={won}
        maxStars={0}
        headerTrailing={t("memory.attemptsShort", { attempts })}
        isLastLevel={levelIdx >= MEMORY_LEVELS.length - 1}
        onNextLevel={() => {
          clearTimers();
          setLevelIdx((i) => i + 1);
        }}
        onReplay={() => startLevel(levelIdx)}
      >
        {feedback && (
          <div className={`mg-feedback mg-feedback--${feedback}`}>
            {feedback === "correct" ? "✅" : "❌"}
          </div>
        )}

        <div className="mg-stats-line" aria-live="polite">
          {t("memory.score", { matches })}
        </div>

        <div
          className="mg-grid"
          style={{
            gridTemplateColumns: `repeat(${currentLevel.cols}, ${cardSize}px)`,
            gridTemplateRows: `repeat(${currentLevel.rows}, ${cardSize}px)`,
            gap: `${gapPx}px`,
          }}
        >
          {cards.map((card) => {
            const face = isFlipped(card.id);
            return (
              <button
                key={card.id}
                type="button"
                className={`mg-card${face ? " mg-card--flipped" : ""}${matched.has(card.id) ? " mg-card--matched" : ""}`}
                style={{
                  width: cardSize,
                  height: cardSize,
                  fontSize: emojiFontSize,
                }}
                onPointerUp={() => handleCardTap(card.id)}
                aria-label={face ? card.emoji : t("memory.cardAria")}
              >
                <div className="mg-card-inner">
                  <div className="mg-card-back">❓</div>
                  <div className="mg-card-front">{card.emoji}</div>
                </div>
              </button>
            );
          })}
        </div>
      </LearningGameShell>
    </div>
  );
}
