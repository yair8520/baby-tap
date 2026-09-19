import './LearningGameShell.css';
import { getT } from '../../i18n/index.js';

/**
 * Shared chrome for learning games: exit, level badge, stars, complete overlay.
 */
export function LearningGameShell({
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
  const t = getT(lang);

  return (
    <>
      <div className="lgs-header">
        <button
          type="button"
          className="lgs-btn-exit"
          onClick={onExit}
          aria-label={t("learning.exit")}
        >
          ✕
        </button>
        <span className="lgs-level-label">
          {t("learning.level", { level: levelNum })}
        </span>
        <span className="lgs-hdr-stars" aria-hidden="true">
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="learning-complete-title"
          aria-live="polite"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div className="lgs-complete-card">
            <span className="lgs-complete-emoji" aria-hidden="true">🎉</span>
            <div id="learning-complete-title" className="lgs-complete-title">
              {isLastLevel
                ? t("learning.allComplete")
                : t("learning.greatJob")}
            </div>
            <div className="lgs-complete-stars" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`lgs-cstar${i < starCount ? ' on' : ''}`}>⭐</span>
              ))}
            </div>
            {totalStars != null && (
              <div className="lgs-total-score">
                {t("learning.totalStars", { total: totalStars })}
              </div>
            )}
            <div className="lgs-actions">
              {onReplay && (
                <button type="button" className="lgs-btn-replay" onClick={onReplay}>
                  {t("learning.replay")}
                </button>
              )}
              {onNextLevel && !isLastLevel && (
                <button type="button" className="lgs-btn-next" onClick={onNextLevel}>
                  {t("learning.nextLevel")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LearningGameShell;
