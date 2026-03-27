import { useState, useEffect, useCallback } from "react";
import { MEMORY_LEVELS, buildDeck } from "./levels.js";
import "./MemoryGame.css";

export default function MemoryGame({ lang, onSound }) {
  const isHe = lang === "he";
  const L = (he, en) => (isHe ? he : en);

  const [levelIdx, setLevelIdx] = useState(0);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]); // ids of face-up, unmatched
  const [matched, setMatched] = useState(new Set());
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong"

  const currentLevel = MEMORY_LEVELS[levelIdx];

  const startLevel = useCallback((idx) => {
    const lvl = MEMORY_LEVELS[idx];
    setCards(buildDeck(lvl));
    setFlipped([]);
    setMatched(new Set());
    setAttempts(0);
    setWon(false);
    setLocked(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    startLevel(levelIdx);
  }, [levelIdx, startLevel]);

  const handleCardTap = useCallback((cardId) => {
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
        // Match!
        setTimeout(() => {
          setFeedback("correct");
          onSound?.("match");
          const newMatched = new Set([...matched, a.id, b.id]);
          setMatched(newMatched);
          setFlipped([]);
          setLocked(false);
          setTimeout(() => setFeedback(null), 700);

          if (newMatched.size === cards.length) {
            setWon(true);
          }
        }, 400);
      } else {
        // No match — flip back after delay
        setTimeout(() => {
          setFeedback("wrong");
          onSound?.("miss");
          setTimeout(() => {
            setFlipped([]);
            setLocked(false);
            setFeedback(null);
          }, 400);
        }, 700);
      }
    }
  }, [locked, matched, flipped, cards, onSound]);

  const isFlipped = (id) => flipped.includes(id) || matched.has(id);

  return (
    <div className="mg-root" dir={isHe ? "rtl" : "ltr"}>
      {/* Header bar */}
      <div className="mg-header">
        <span className="mg-level-badge">
          {L(`רמה ${currentLevel.id}`, `Level ${currentLevel.id}`)}
        </span>
        <span className="mg-stats">
          {L(`התאמות: ${matched.size / 2}`, `Matches: ${matched.size / 2}`)}
          &nbsp;·&nbsp;
          {L(`ניסיונות: ${attempts}`, `Tries: ${attempts}`)}
        </span>
      </div>

      {/* Win overlay */}
      {won && (
        <div className="mg-win-overlay">
          <div className="mg-win-box">
            <div className="mg-win-emoji">🎉</div>
            <div className="mg-win-title">{L("כל הכבוד!", "Well done!")}</div>
            <div className="mg-win-sub">
              {L(`${attempts} ניסיונות`, `${attempts} tries`)}
            </div>
            <div className="mg-win-actions">
              {levelIdx < MEMORY_LEVELS.length - 1 && (
                <button
                  className="mg-btn mg-btn--primary"
                  onTouchEnd={(e) => { e.preventDefault(); setLevelIdx((i) => i + 1); }}
                  onMouseUp={() => setLevelIdx((i) => i + 1)}
                >
                  {L("רמה הבאה ➡️", "Next Level ➡️")}
                </button>
              )}
              <button
                className="mg-btn"
                onTouchEnd={(e) => { e.preventDefault(); startLevel(levelIdx); }}
                onMouseUp={() => startLevel(levelIdx)}
              >
                {L("שחק שוב 🔄", "Play again 🔄")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback flash */}
      {feedback && (
        <div className={`mg-feedback mg-feedback--${feedback}`}>
          {feedback === "correct" ? "✅" : "❌"}
        </div>
      )}

      {/* Card grid */}
      <div
        className="mg-grid"
        style={{
          gridTemplateColumns: `repeat(${currentLevel.cols}, 1fr)`,
        }}
      >
        {cards.map((card) => {
          const face = isFlipped(card.id);
          return (
            <button
              key={card.id}
              className={`mg-card${face ? " mg-card--flipped" : ""}${matched.has(card.id) ? " mg-card--matched" : ""}`}
              onTouchEnd={(e) => { e.preventDefault(); handleCardTap(card.id); }}
              onMouseUp={() => handleCardTap(card.id)}
              aria-label={face ? card.emoji : "card"}
            >
              <div className="mg-card-inner">
                <div className="mg-card-back">❓</div>
                <div className="mg-card-front">{card.emoji}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Level selector dots */}
      <div className="mg-level-dots">
        {MEMORY_LEVELS.map((lvl, i) => (
          <button
            key={lvl.id}
            className={`mg-dot${i === levelIdx ? " mg-dot--active" : ""}${i > levelIdx ? " mg-dot--locked" : ""}`}
            onTouchEnd={(e) => { e.preventDefault(); if (i <= levelIdx + 1) setLevelIdx(i); }}
            onMouseUp={() => { if (i <= levelIdx + 1) setLevelIdx(i); }}
            aria-label={`Level ${lvl.id}`}
          />
        ))}
      </div>
    </div>
  );
}
