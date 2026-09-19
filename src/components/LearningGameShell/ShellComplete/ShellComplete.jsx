import { useT } from "../../../i18n";
import { DEFAULT_SHELL_COMPLETE_PROPS } from "./ShellComplete.props.js";
import "./ShellComplete.css";

/** Celebration overlay shown when a stage is finished. */
export function ShellComplete({
  starCount = DEFAULT_SHELL_COMPLETE_PROPS.starCount,
  maxStars = DEFAULT_SHELL_COMPLETE_PROPS.maxStars,
  totalStars,
  isLastLevel = DEFAULT_SHELL_COMPLETE_PROPS.isLastLevel,
  onNextLevel,
  onReplay,
}) {
  const t = useT();
  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="lgs-complete"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-complete-title"
      aria-live="polite"
      onPointerDown={stop}
      onPointerUp={stop}
    >
      <div className="lgs-complete-card">
        <span className="lgs-complete-emoji" aria-hidden="true">
          🎉
        </span>
        <div id="learning-complete-title" className="lgs-complete-title">
          {isLastLevel ? t("learning.allComplete") : t("learning.greatJob")}
        </div>
        <div className="lgs-complete-stars" aria-hidden="true">
          {Array.from({ length: maxStars }, (_, i) => (
            <span key={i} className={`lgs-cstar${i < starCount ? " on" : ""}`}>
              ⭐
            </span>
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
  );
}
