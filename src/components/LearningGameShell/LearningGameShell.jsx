import './LearningGameShell.css';

/**
 * Shared chrome for learning games: exit, level badge, stars, complete overlay.
 */
export default function LearningGameShell({
  lang = 'he',
  levelNum = 1,
  totalStars,
  onExit,
  levelDone = false,
  starCount = 3,
  onNextLevel,
  onReplay,
  isLastLevel = false,
  children,
}) {
  const isHe = lang === 'he';

  return (
    <>
      <div className="lgs-header">
        <button type="button" className="lgs-btn-exit" onClick={onExit} aria-label="exit">
          ✕
        </button>
        <span className="lgs-level-label">
          {isHe ? `שלב ${levelNum}` : `Level ${levelNum}`}
        </span>
        <span className="lgs-hdr-stars">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`lgs-hdr-star${i < starCount ? " lgs-hdr-star--on" : ""}`}
            >
              ⭐
            </span>
          ))}
        </span>
      </div>

      {children}

      {levelDone && (
        <div
          className="lgs-complete"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div className="lgs-complete-card">
            <span className="lgs-complete-emoji">🎉</span>
            <div className="lgs-complete-title">
              {isLastLevel
                ? (isHe ? 'סיימת את כל השלבים!' : 'All levels complete!')
                : (isHe ? 'כל הכבוד!' : 'Great job!')}
            </div>
            <div className="lgs-complete-stars">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`lgs-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            {totalStars != null && (
              <div className="lgs-total-score">
                {isHe ? `סה"כ ⭐ ${totalStars}` : `Total ⭐ ${totalStars}`}
              </div>
            )}
            <div className="lgs-actions">
              {onReplay && (
                <button type="button" className="lgs-btn-replay" onClick={onReplay}>
                  {isHe ? 'שוב ↻' : 'Replay ↻'}
                </button>
              )}
              {onNextLevel && !isLastLevel && (
                <button type="button" className="lgs-btn-next" onClick={onNextLevel}>
                  {isHe ? 'שלב הבא ➜' : 'Next Level ➜'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
